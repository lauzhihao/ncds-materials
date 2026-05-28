#!/usr/bin/env python3
"""一次性 probe：拿 S1-02 三句拼整段调 CosyVoice + word_timestamp，
走 dashscope SDK v2（WebSocket），dump 音频 + 时间戳，
并验证按 begin_index 折叠回 beat 区间的算法。

产物（都在 audio_probe/ 下）：
  scene-S1-02.mp3
  scene-S1-02.events.json   on_event 收到的所有事件
  scene-S1-02.words.json    抽出来的 words 数组
  scene-S1-02.beats.json    折叠后的每 beat audioStart/audioEnd
"""
import json
import os
import sys
import threading
from pathlib import Path

import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer, ResultCallback, AudioFormat

HERE = Path(__file__).resolve().parent
EPISODE_JSON = HERE / "episode.json"
OUT_DIR = HERE / "audio_probe"
SCENE_ID = os.environ.get("SCENE", "S1-02")


def collect_scene_beats(episode: dict, scene_id: str):
    out = []
    for i, b in enumerate(episode.get("beats", [])):
        if b.get("scene") == scene_id and b.get("zh"):
            out.append((i, b["zh"]))
    return out


class Collector(ResultCallback):
    def __init__(self):
        self.audio = bytearray()
        self.events = []
        self.error = None
        self.complete = False
        self.done = threading.Event()  # set on complete or error

    def on_open(self):
        self.events.append({"type": "open"})

    def on_data(self, data: bytes):
        self.audio.extend(data)

    def on_event(self, message):
        try:
            obj = json.loads(message) if isinstance(message, str) else message
        except Exception:
            obj = {"raw": str(message)}
        self.events.append(obj)

    def on_complete(self):
        self.complete = True
        self.events.append({"type": "complete"})
        self.done.set()

    def on_error(self, message):
        self.error = str(message)
        self.events.append({"type": "error", "message": str(message)})
        self.done.set()

    def on_close(self):
        self.events.append({"type": "close"})


def extract_words(events):
    """CosyVoice 行为：每次 result-generated 重发当前 sentence 累积 words；
    type=sentence-end 的那次是最终回执（即"完整"那份）。
    一个 input text 通常对应 1 个 sentence.index，但 SDK 可能为同一句重复发
    sentence-begin/sentence-end，需要按 index 去重。

    返回：单一 sentence 的 words（如果只看到一个 index），或按 index 顺序拼接。
    begin_index / begin_time 在文档里描述是相对整段输入的全局位置，
    所以**不做** offset 累加（多 sentence 时直接 append）。
    """
    per_sent_final = {}   # idx → words from sentence-end
    per_sent_long  = {}   # idx → longest words seen
    for ev in events:
        if not isinstance(ev, dict):
            continue
        h = ev.get("header") or {}
        if h.get("event") != "result-generated":
            continue
        out = (ev.get("payload") or {}).get("output") or {}
        sent = out.get("sentence") or {}
        idx = sent.get("index")
        ws = sent.get("words") or []
        if idx is None or not ws:
            continue
        if out.get("type") == "sentence-end":
            per_sent_final[idx] = ws
        prev = per_sent_long.get(idx) or []
        if len(ws) > len(prev):
            per_sent_long[idx] = ws

    # 观察：CosyVoice 对一次输入可能发多个 sentence.index（一个是 sentence-synthesis
    # 增量，一个是 sentence-end 汇总），但它们 begin_index 均从 0 起且重叠。
    # 按 begin_index 去重，优先保留 sentence-end 那份。
    by_idx = {}
    sent_order = sorted(set(list(per_sent_final.keys()) + list(per_sent_long.keys())))
    # 先填非 sentence-end 累积
    for idx in sent_order:
        for w in (per_sent_long.get(idx) or []):
            by_idx.setdefault(w.get("begin_index"), w)
    # 再用 sentence-end 覆盖
    for idx in sent_order:
        for w in (per_sent_final.get(idx) or []):
            by_idx[w.get("begin_index")] = w
    merged = [by_idx[k] for k in sorted(by_idx.keys())]
    return merged, per_sent_long


def fold_words_into_beats(words, beat_char_ranges):
    out = []
    for (beat_idx, zh, char_start, char_end) in beat_char_ranges:
        in_range = [w for w in words if w.get("begin_index", -1) >= char_start
                    and w.get("end_index", -1) <= char_end]
        if not in_range:
            out.append({"beat": beat_idx, "zh": zh, "words_found": 0})
            continue
        out.append({
            "beat": beat_idx,
            "zh": zh,
            "char_range": [char_start, char_end],
            "words_found": len(in_range),
            "audioStart": min(w["begin_time"] for w in in_range),
            "audioEnd":   max(w["end_time"]   for w in in_range),
            "first_char": in_range[0].get("text"),
            "last_char":  in_range[-1].get("text"),
        })
    return out


def main() -> int:
    if "DASHSCOPE_API_KEY" not in os.environ:
        print("DASHSCOPE_API_KEY env var not set", file=sys.stderr)
        return 2
    dashscope.api_key = os.environ["DASHSCOPE_API_KEY"]

    OUT_DIR.mkdir(exist_ok=True)
    episode = json.loads(EPISODE_JSON.read_text(encoding="utf-8"))
    tts = (episode.get("audio") or {}).get("tts") or {}
    model = tts.get("model", "cosyvoice-v3-flash")
    voice = tts.get("voice", "longtian_v3")
    sample_rate = int(tts.get("sampleRate", 22050))

    # 也可以用命令行参数覆盖 voice 做对比
    if len(sys.argv) > 1:
        voice = sys.argv[1]

    beats = collect_scene_beats(episode, SCENE_ID)
    parts, ranges = [], []
    cursor = 0
    for (beat_idx, zh) in beats:
        parts.append(zh)
        ranges.append((beat_idx, zh, cursor, cursor + len(zh)))
        cursor += len(zh)
    combined = "".join(parts)
    print(f"scene {SCENE_ID}: {len(beats)} beats, {len(combined)} chars")
    print(f"  text: {combined!r}")
    for (i, _, s, e) in ranges:
        print(f"  beat#{i} chars[{s}:{e}]")
    print(f"\nmodel={model} voice={voice} sr={sample_rate} + word_timestamp_enabled")

    cb = Collector()
    fmt_map = {22050: AudioFormat.MP3_22050HZ_MONO_256KBPS,
               24000: AudioFormat.MP3_24000HZ_MONO_256KBPS}
    audio_format = fmt_map.get(sample_rate, AudioFormat.MP3_22050HZ_MONO_256KBPS)

    synth = SpeechSynthesizer(
        model=model,
        voice=voice,
        format=audio_format,
        callback=cb,
        additional_params={"word_timestamp_enabled": True},
    )
    synth.call(combined, timeout_millis=120000)
    # call() 是 async（SDK 内部 async_call=True），必须自己等 done event
    if not cb.done.wait(timeout=120):
        print("WARN: timed out waiting for on_complete/on_error", file=sys.stderr)

    print(f"\ncomplete={cb.complete} error={cb.error} audio_bytes={len(cb.audio)} events={len(cb.events)}")

    # 落盘 raw 事件
    (OUT_DIR / f"scene-{SCENE_ID}.events.json").write_text(
        json.dumps(cb.events, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"events dumped → audio_probe/scene-{SCENE_ID}.events.json")

    # 落盘音频
    mp3_out = OUT_DIR / f"scene-{SCENE_ID}.mp3"
    mp3_out.write_bytes(bytes(cb.audio))
    print(f"mp3 → {mp3_out} ({mp3_out.stat().st_size} bytes)")

    words, per_sent = extract_words(cb.events)
    print(f"\nsentences seen: {sorted(per_sent.keys())}  total words: {len(words)}")
    for idx in sorted(per_sent.keys()):
        ws = per_sent[idx]
        print(f"  sent#{idx}: {len(ws)} words → {''.join(w['text'] for w in ws)!r}")
    if words:
        print("  first 6 merged:", json.dumps(words[:6], ensure_ascii=False))
        print("  last  3 merged:", json.dumps(words[-3:], ensure_ascii=False))
    (OUT_DIR / f"scene-{SCENE_ID}.words.json").write_text(
        json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    folded = fold_words_into_beats(words, ranges)
    (OUT_DIR / f"scene-{SCENE_ID}.beats.json").write_text(
        json.dumps(folded, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("\nfolded per-beat timing:")
    for f in folded:
        if "audioStart" in f:
            print(f"  beat#{f['beat']} [{f['audioStart']}..{f['audioEnd']}ms] "
                  f"first={f['first_char']!r} last={f['last_char']!r} words={f['words_found']}")
        else:
            print(f"  beat#{f['beat']} NO WORDS FOUND")

    return 0


if __name__ == "__main__":
    sys.exit(main())
