#!/usr/bin/env python3
"""
从 beats.js 解析 zh 字段，逐条生成 audio/NNNN.mp3。
- 默认音色 zh-CN-YunxiNeural (云希, 男)。覆写：VOICE 环境变量
- 默认语速正常。覆写：RATE 环境变量，如 "-10%" 或 "+5%"
- 幂等：若目标文件存在则跳过；要强制重生成，传 --force

依赖：pipx install edge-tts （提供 edge-tts CLI）
"""
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
BEATS_JS = HERE / "beats.js"
AUDIO_DIR = HERE / "audio"
VOICE = os.environ.get("VOICE", "zh-CN-YunxiNeural")
RATE = os.environ.get("RATE", "+0%")

ZH_PATTERN = re.compile(r'\bzh:\s*"((?:[^"\\]|\\.)*)"')


def parse_beats(text: str) -> list[str]:
    return [m.group(1) for m in ZH_PATTERN.finditer(text)]


def synth(text: str, out_path: Path, attempts: int = 4) -> None:
    tmp = out_path.with_suffix(out_path.suffix + ".part")
    cmd = [
        "edge-tts",
        "--voice", VOICE,
        "--rate", RATE,
        "--text", text,
        "--write-media", str(tmp),
    ]
    last_err: subprocess.CalledProcessError | None = None
    for n in range(1, attempts + 1):
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=30)
            tmp.rename(out_path)
            return
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
            last_err = e if isinstance(e, subprocess.CalledProcessError) else None
            wait = 1.5 * n
            print(f"  retry {n}/{attempts - 1} after {wait:.1f}s ({type(e).__name__})", flush=True)
            time.sleep(wait)
            tmp.unlink(missing_ok=True)
    if last_err is not None:
        raise last_err
    raise RuntimeError("edge-tts timed out repeatedly")


def main() -> int:
    if shutil.which("edge-tts") is None:
        print("edge-tts CLI not found. Install with: pipx install edge-tts", file=sys.stderr)
        return 1

    force = "--force" in sys.argv[1:]
    beats = parse_beats(BEATS_JS.read_text(encoding="utf-8"))
    if not beats:
        print("No zh: entries found in beats.js", file=sys.stderr)
        return 2

    AUDIO_DIR.mkdir(exist_ok=True)
    total = len(beats)
    width = max(4, len(str(total)))
    new_count = 0
    skip_count = 0

    for i, zh in enumerate(beats, start=1):
        name = f"{i:0{width}d}.mp3"
        out = AUDIO_DIR / name
        if out.exists() and not force:
            skip_count += 1
            continue
        print(f"[{i:>{width}}/{total}] {zh[:32]}{'…' if len(zh) > 32 else ''}", flush=True)
        try:
            synth(zh, out)
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode(errors="replace") if e.stderr else ""
            print(f"  ! edge-tts failed (exit {e.returncode}): {stderr[:500]}", file=sys.stderr)
            return 3
        new_count += 1
        time.sleep(0.3)  # gentle throttle to avoid Edge TTS rate limit

    print(f"done. voice={VOICE} rate={RATE} total={total} new={new_count} skipped={skip_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
