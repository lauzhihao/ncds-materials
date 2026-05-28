#!/usr/bin/env python3
"""读取 <out-dir>/storyboard.json，调 gpt-image-2 出图，落 <out-dir>/images/NN.png。

storyboard.json:
  { "meta": {"size": "1024x1536", "theme": "..."},
    "noTextHint": "可选，覆盖默认负面提示",
    "shots": [ {"n": 1, "copy": "...", "visual": "...", "prompt": "english prompt"}, ... ] }

依赖：gpt-image-2 生成脚本 + 环境变量 GPT_IMAGE2_BASE_URL / GPT_IMAGE2_API_KEY
（和仓库 pic_gen.py 同一套）。生成脚本路径按以下顺序解析：
  $GPT_IMAGE_GEN
  ~/.codex/skills/gpt-image/scripts/gpt_image_gen.py
  ~/projects/ncds-opus-studio/gpt_image/gpt_image_gen.py
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DEFAULT_STYLE_PREFIX = (
    "Minimalist pictogram in the universal public-signage style, like airport wayfinding icons. "
    "Flat solid-black silhouettes on a plain pure-white background. Consistent figure design "
    "throughout: simple rounded head, smooth thick rounded limbs, no neck, no face, no fingers, "
    "no interior lines, no outline — filled black shapes only. Limbs clearly separated from the "
    "torso so the silhouette reads at a glance. Flat front or side view, no perspective, no "
    "foreshortening, no cast shadow. Generous empty negative space, calm and quiet. "
    "Pure black and white, no gray, no gradient, no color."
)
DEFAULT_NO_TEXT = (
    "严格要求：整张图绝对不能出现任何文字、汉字、英文字母、阿拉伯数字、标点、logo 或水印。"
    "Not photorealistic, no texture, no gradient, no color, no background clutter — "
    "pure flat black-and-white pictogram only."
)


def resolve_gen_script() -> Path | None:
    candidates = [
        os.environ.get("GPT_IMAGE_GEN"),
        str(Path.home() / ".codex/skills/gpt-image/scripts/gpt_image_gen.py"),
        str(Path.home() / "projects/ncds-opus-studio/gpt_image/gpt_image_gen.py"),
    ]
    for c in candidates:
        if c and Path(c).expanduser().exists():
            return Path(c).expanduser()
    return None


def gen_one(shot: dict, *, gen_script: Path, out_dir: Path, size: str, style_prefix: str, no_text_hint: str, force: bool) -> tuple[str, str]:
    nn = f"{int(shot['n']):02d}"
    target = out_dir / "images" / f"{nn}.png"
    if target.exists() and not force:
        return nn, "skipped"

    body = (shot.get("prompt") or "").strip()
    if not body:
        return nn, "failed (empty prompt)"
    prompt = " ".join(p for p in (style_prefix.strip(), body, no_text_hint.strip()) if p)

    tmp = Path("/tmp/whisper-reel") / out_dir.name / nn
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True, exist_ok=True)

    print(f"  [{nn}] generating ({size})...", flush=True)
    t0 = time.time()
    res = subprocess.run(
        [
            "python3", str(gen_script),
            "--out-dir", str(tmp),
            "--size", size,
            "--quality", "auto",
            "--overwrite",
            "--prompt", prompt,
        ],
        capture_output=True, text=True, timeout=600,
    )
    if res.returncode != 0:
        tail = (res.stderr or res.stdout or "")[-400:]
        print(f"  ! [{nn}] gpt-image FAILED in {time.time()-t0:.1f}s: {tail}", file=sys.stderr)
        return nn, "failed"

    src = tmp / "image_01.png"
    if not src.exists():
        # 提供方可能返回非 png 扩展名，兜底取第一张 image_*
        alts = sorted(tmp.glob("image_01.*"))
        if alts:
            src = alts[0]
        else:
            print(f"  ! [{nn}] expected {src} not found", file=sys.stderr)
            return nn, "failed"

    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, target)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"  ✓ [{nn}] {target.stat().st_size/1024:.0f} KB ({time.time()-t0:.1f}s)", flush=True)
    return nn, "ok"


def main() -> int:
    ap = argparse.ArgumentParser(description="按 storyboard.json 批量出图")
    ap.add_argument("out_dir", help="包含 storyboard.json 的输出目录")
    ap.add_argument("--size", default=None, help="覆盖出图尺寸（默认读 meta.size，再默认 1024x1536）")
    ap.add_argument("--jobs", "-j", type=int, default=int(os.environ.get("PIC_JOBS") or 5))
    ap.add_argument("--force", action="store_true", help="已存在也重生")
    ap.add_argument("--only", nargs="*", type=int, help="只生成这些镜号")
    args = ap.parse_args()

    out_dir = Path(args.out_dir).expanduser().resolve()
    sb_path = out_dir / "storyboard.json"
    if not sb_path.exists():
        print(f"找不到 {sb_path}", file=sys.stderr)
        return 2

    gen_script = resolve_gen_script()
    if gen_script is None:
        print(
            "找不到 gpt-image-2 生成脚本。设 $GPT_IMAGE_GEN 指向 gpt_image_gen.py，"
            "或确认 ~/.codex/skills/gpt-image/scripts/ 或 ~/projects/ncds-opus-studio/gpt_image/ 下存在该脚本。",
            file=sys.stderr,
        )
        return 4
    for var in ("GPT_IMAGE2_BASE_URL", "GPT_IMAGE2_API_KEY"):
        if not (os.environ.get(var) or "").strip():
            print(f"环境变量 {var} 未设置——出图会失败，请先 export 后重跑。", file=sys.stderr)
            return 5

    sb = json.loads(sb_path.read_text(encoding="utf-8"))
    meta = sb.get("meta") or {}
    size = args.size or meta.get("size") or "1024x1536"
    style_prefix = meta.get("stylePrefix") or sb.get("stylePrefix") or DEFAULT_STYLE_PREFIX
    no_text = meta.get("noTextHint") or sb.get("noTextHint") or DEFAULT_NO_TEXT
    shots = sb.get("shots") or []
    if args.only:
        keep = set(args.only)
        shots = [s for s in shots if int(s["n"]) in keep]

    (out_dir / "images").mkdir(parents=True, exist_ok=True)
    jobs = max(1, args.jobs)
    print(f"gen: {len(shots)} shots ({size}) jobs={jobs} via {gen_script}\n  -> {out_dir / 'images'}")

    ok = sk = fail = 0
    with ThreadPoolExecutor(max_workers=jobs) as pool:
        futs = {
            pool.submit(
                gen_one, s, gen_script=gen_script, out_dir=out_dir,
                size=size, style_prefix=style_prefix, no_text_hint=no_text, force=args.force,
            ): s for s in shots
        }
        for fut in as_completed(futs):
            try:
                _, result = fut.result()
            except Exception as e:
                print(f"  ! [{futs[fut].get('n')}] worker crashed: {e}", file=sys.stderr)
                fail += 1
                continue
            if result == "ok":
                ok += 1
            elif result == "skipped":
                sk += 1
            else:
                fail += 1

    print(f"\ndone. ok={ok} skipped={sk} failed={fail}")
    return 0 if fail == 0 else 3


if __name__ == "__main__":
    sys.exit(main())
