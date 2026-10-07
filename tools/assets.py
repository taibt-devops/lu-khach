"""Generate Lữ Khách art through Game Asset Studio (http://127.0.0.1:8765) and bundle it into game/assets.js.

    python tools/assets.py style
    python tools/assets.py hero [--n 2]          # candidates → build/hero.png
    python tools/assets.py use-hero ID           # pick one; it also becomes the style reference
    python tools/assets.py gen [--redo a,b]      # items, backgrounds, then edits, then animations
    python tools/assets.py sheet                 # build/sheet.png for review
    python tools/assets.py export                # game/assets.js (every image + voice clip as a data URI)
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import sys
import time
from pathlib import Path

import httpx
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SPEC = json.loads((ROOT / "content" / "assets.json").read_text(encoding="utf-8"))
MAP = ROOT / "tools" / "asset_map.json"
BUILD = ROOT / "build"
GAME = ROOT / "game"
MAX_SPEND = 8.0
c = httpx.Client(base_url="http://127.0.0.1:8765", timeout=60)


def api(method, path, **kw):
    r = c.request(method, path, **kw)
    if r.status_code >= 400:
        sys.exit(f"{method} {path} -> {r.status_code}: {r.text}")
    return r.json() if "json" in r.headers.get("content-type", "") else r


def load_map() -> dict:
    return json.loads(MAP.read_text(encoding="utf-8")) if MAP.exists() else {"assets": {}, "anims": {}}


def save_map(m: dict) -> None:
    MAP.write_text(json.dumps(m, indent=2), encoding="utf-8")


def budget(n: int, each: float = 0.03) -> None:
    spent = api("GET", "/api/meta")["total_cost"]
    print(f"studio spent ${spent:.3f}; planned {n} images (~${n * each:.2f})")
    if spent + n * each > MAX_SPEND:
        sys.exit("over budget — stopping")


def wait(jobs: dict[str, str], timeout: int = 900) -> dict[str, dict]:
    done, t0 = {}, time.time()
    while len(done) < len(jobs) and time.time() - t0 < timeout:
        time.sleep(3)
        for jid, label in jobs.items():
            if jid not in done:
                j = api("GET", f"/api/jobs/{jid}")
                if j["status"] in ("done", "error"):
                    done[jid] = j
                    print(f"  [{len(done)}/{len(jobs)}] {'ok ' if j['status'] == 'done' else 'ERR'} {label} "
                          f"({time.time() - t0:.0f}s) {j['error'] or ''}")
    return done


def style_id() -> int:
    s = SPEC["style"]
    found = next((x for x in api("GET", "/api/styles") if x["name"] == s["name"]), None)
    if found:
        return found["id"]
    return api("POST", "/api/styles", json={"name": s["name"], "prompt": s["prompt"], "recipe": s["recipe"]})["id"]


def approve(aid: int, name: str) -> None:
    api("PATCH", f"/api/assets/{aid}", json={"status": "approved", "name": f"lk {name}"})


def generate(kind: str, prompt: str, quality: str, n: int = 1) -> str:
    return api("POST", "/api/generate", json={"kind": kind, "description": prompt, "style_id": style_id(),
                                               "quality": quality, "n": n})["id"]


def png(aid: int) -> Image.Image:
    a = api("GET", f"/api/assets/{aid}")
    return Image.open(io.BytesIO(c.get(a["url"]).content)).convert("RGBA")


def contact(items: list[tuple[str, int]], path: Path, cols: int = 6, cell: int = 220) -> None:
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * (cell + 24)), (232, 238, 230))
    d = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=15)
    for i, (label, aid) in enumerate(items):
        img = png(aid)
        img.thumbnail((cell - 12, cell - 12))
        x, y = (i % cols) * cell, (i // cols) * (cell + 24)
        sheet.paste(img, (x + (cell - img.width) // 2, y + 4), img)
        d.text((x + 6, y + cell + 2), f"{label} #{aid}", fill=(20, 60, 70), font=font)
    BUILD.mkdir(exist_ok=True)
    sheet.save(path)
    print("wrote", path)


# --- commands --------------------------------------------------------------------------

def cmd_style(args) -> None:
    print("style id", style_id())


def cmd_hero(args) -> None:
    budget(args.n)
    job = wait({generate("character", SPEC["hero"]["prompt"], args.quality, args.n): "hero"})
    ids = next(iter(job.values()))["result"]["asset_ids"]
    contact([("hero", i) for i in ids], BUILD / "hero.png", cols=len(ids), cell=360)


def cmd_use_hero(args) -> None:
    m = load_map()
    m["assets"]["hero"] = args.id
    approve(args.id, "hero")
    api("PATCH", f"/api/styles/{style_id()}", json={"ref_ids": [args.id]})
    save_map(m)
    print(f"hero = #{args.id} (also the style reference)")


def cmd_gen(args) -> None:
    m = load_map()
    redo = set(filter(None, args.redo.split(",")))
    if "hero" not in m["assets"]:
        sys.exit("pick the hero first: assets.py hero / use-hero ID")

    # 1. independent images: items + backgrounds
    todo = {k: ("item" if v["kind"] == "item" else v["kind"], v["prompt"]) for k, v in SPEC["items"].items()}
    todo.update({k: ("background", p + ". No people, no animals, no text.") for k, p in SPEC["backgrounds"].items()})
    todo = {k: v for k, v in todo.items() if k not in m["assets"] or k in redo}
    if todo:
        budget(len(todo))
        jobs = {generate(kind, prompt, args.quality): key for key, (kind, prompt) in todo.items()}
        for jid, job in wait(jobs).items():
            if job["status"] == "done":
                aid = job["result"]["asset_ids"][0]
                m["assets"][jobs[jid]] = aid
                approve(aid, jobs[jid])
        save_map(m)

    # 2. edits of a base image (same character, new pose)
    edits = {k: v for k, v in SPEC["edits"].items() if v["base"] in m["assets"] and (k not in m["assets"] or k in redo)}
    if edits:
        budget(len(edits))
        jobs = {}
        for key, e in edits.items():
            j = api("POST", f"/api/assets/{m['assets'][e['base']]}/edit",
                    json={"instruction": e["prompt"], "quality": args.quality, "n": 1})
            jobs[j["id"]] = key
        for jid, job in wait(jobs).items():
            if job["status"] == "done":
                aid = job["result"]["asset_ids"][0]
                m["assets"][jobs[jid]] = aid
                approve(aid, jobs[jid])
        save_map(m)

    # 3. frame animations of the hero
    anims = {k: v for k, v in SPEC["animations"].items() if k not in m["anims"] or k in redo}
    if anims:
        budget(sum(len(v["poses"]) for v in anims.values()))
        jobs = {}
        for key, a in anims.items():
            r = api("POST", "/api/animations", json={
                "base_asset_id": m["assets"][a["base"]], "action": key, "poses": a["poses"],
                "view": "seen exactly from the side, facing right", "quality": args.quality, "fps": a["fps"],
                "name": f"lk {key}"})
            jobs[r["job"]["id"]] = key
            m["anims"][key] = r["animation"]["id"]
        save_map(m)
        wait(jobs, timeout=1500)
    print("assets:", sorted(m["assets"]), "anims:", sorted(m["anims"]))


def frames_of(anim_id: int) -> list[int]:
    return [f["id"] for f in api("GET", f"/api/animations/{anim_id}")["frames"]]


def cmd_sheet(args) -> None:
    m = load_map()
    items = list(m["assets"].items())
    for key, aid in m["anims"].items():
        items += [(f"{key}{i}", fid) for i, fid in enumerate(frames_of(aid))]
    contact(items, BUILD / "sheet.png")


def seamless_x(img: Image.Image, overlap: int) -> Image.Image:
    """Cross-fade the right edge into the left so the picture tiles horizontally."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    w = a.shape[1]
    out = a[:, : w - overlap].copy()
    t = np.linspace(0, 1, overlap)[None, :, None]
    out[:, :overlap] = a[:, w - overlap:] * (1 - t) + a[:, :overlap] * t
    return Image.fromarray(out.astype(np.uint8), "RGB")


def data_uri(img: Image.Image, quality: int = 86) -> str:
    buf = io.BytesIO()
    img.save(buf, "WEBP", quality=quality, method=4)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def cmd_export(args) -> None:
    m = load_map()
    images, frames = {}, {}
    for key, aid in m["assets"].items():
        img = png(aid)
        if key.startswith("bg-"):
            img = img.convert("RGB")
            img.thumbnail((1600, 1600))
            if key in ("bg-run", "bg-river", "bg-night", "bg-cliff"):   # these scroll sideways in a TileSprite
                img = seamless_x(img, overlap=img.width // 6)
            images[key] = data_uri(img, 80)
        else:
            img.thumbnail((384, 384) if key in ("heart", "shield", "sword", "lantern-off", "lantern-on", "stone", "sign", "rock", "scroll", "slab", "arrow") else (512, 512))
            images[key] = data_uri(img)
    for key, aid in m["anims"].items():
        frames[key] = []
        for i, fid in enumerate(frames_of(aid)):
            img = png(fid)
            img.thumbnail((512, 512))
            images[f"{key}{i}"] = data_uri(img)
            frames[key].append(f"{key}{i}")
    audio = {p.stem: "data:audio/mpeg;base64," + base64.b64encode(p.read_bytes()).decode()
             for p in sorted((ROOT / "content" / "audio").glob("*.mp3"))}
    out = GAME / "assets.js"

    def block(d: dict) -> str:   # one entry per line: small git diffs, and no 6 MB single line for git hosts to choke on
        return "{\n" + ",\n".join(f"{json.dumps(k)}: {json.dumps(v)}" for k, v in d.items()) + "\n}"

    body = f'{{\n"images": {block(images)},\n"frames": {json.dumps(frames)},\n"audio": {block(audio)}\n}}'
    out.write_text("// Generated by tools/assets.py export — every picture and voice clip, inlined.\n"
                   "window.LK_ASSETS = " + body + ";\n", encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size / 1e6:.1f} MB): {len(images)} images, {len(audio)} clips")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("style").set_defaults(fn=cmd_style)
    h = sub.add_parser("hero")
    h.add_argument("--n", type=int, default=2)
    h.set_defaults(fn=cmd_hero)
    u = sub.add_parser("use-hero")
    u.add_argument("id", type=int)
    u.set_defaults(fn=cmd_use_hero)
    g = sub.add_parser("gen")
    g.add_argument("--redo", default="")
    g.set_defaults(fn=cmd_gen)
    sub.add_parser("sheet").set_defaults(fn=cmd_sheet)
    sub.add_parser("export").set_defaults(fn=cmd_export)
    for s in sub.choices.values():
        s.add_argument("--quality", default="medium")
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
