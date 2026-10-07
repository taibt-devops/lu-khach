"""Render the Vietnamese voice clips with OpenAI TTS, then check each by transcribing it back.

Scripture must not be misread: every clip is sent through speech-to-text and compared with its
script; anything below the threshold is listed for a human to listen to (or re-rendered with --redo).

    python tools/audio.py [--redo name,name] [--check-only]
"""
from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
SPEC = json.loads((ROOT / "content" / "audio.json").read_text(encoding="utf-8"))
OUT = ROOT / "content" / "audio"
STUDIO_ENV = Path(r"D:\code\game-asset-studio\.env")
THRESHOLD = 0.85


def api_key() -> str:
    key = os.getenv("OPENAI_API_KEY")
    if not key and STUDIO_ENV.exists():
        for line in STUDIO_ENV.read_text(encoding="utf-8").splitlines():
            if line.startswith("OPENAI_API_KEY="):
                key = line.split("=", 1)[1].strip()
    return key or sys.exit("no OPENAI_API_KEY")


def norm(text: str) -> str:
    text = unicodedata.normalize("NFC", text.lower()).replace("-", " ")
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", text)).strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--redo", default="")
    ap.add_argument("--check-only", action="store_true")
    args = ap.parse_args()
    redo = set(filter(None, args.redo.split(",")))
    client = httpx.Client(base_url="https://api.openai.com/v1", timeout=90,
                          headers={"Authorization": f"Bearer {api_key()}"})
    OUT.mkdir(parents=True, exist_ok=True)

    def render(name: str) -> None:
        clip = SPEC["clips"][name]
        v = SPEC["voices"][clip["voice"]]
        r = client.post("/audio/speech", json={"model": "gpt-4o-mini-tts", "voice": v["voice"], "input": clip["text"],
                                               "instructions": v["instructions"], "response_format": "mp3"})
        r.raise_for_status()
        (OUT / f"{name}.mp3").write_bytes(r.content)

    todo = [n for n in SPEC["clips"] if n in redo or not (OUT / f"{n}.mp3").exists()]
    if todo and not args.check_only:
        with ThreadPoolExecutor(4) as pool:
            list(pool.map(render, todo))
        print(f"rendered {len(todo)} clips")

    def check(name: str) -> tuple[str, float, str]:
        with open(OUT / f"{name}.mp3", "rb") as f:
            r = client.post("/audio/transcriptions", data={"model": "gpt-4o-transcribe", "language": "vi"},
                            files={"file": (f"{name}.mp3", f, "audio/mpeg")})
        r.raise_for_status()
        heard = r.json()["text"]
        return name, difflib.SequenceMatcher(None, norm(SPEC["clips"][name]["text"]), norm(heard)).ratio(), heard

    with ThreadPoolExecutor(4) as pool:
        results = list(pool.map(check, list(SPEC["clips"])))
    bad = 0
    for name, ratio, heard in sorted(results, key=lambda x: x[1]):
        flag = "OK " if ratio >= THRESHOLD else "LOW"
        bad += ratio < THRESHOLD
        print(f"{flag} {ratio:.2f} {name}: {heard}")
    print(f"{len(results) - bad}/{len(results)} clips match their script")


if __name__ == "__main__":
    main()
