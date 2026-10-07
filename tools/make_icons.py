"""Android launcher icons for Lữ Khách: the pilgrim with the Sword of the Spirit on marsh green.

Reads the picture straight out of game/assets.js, so the icon always matches the art in the game.
"""
import base64
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "android" / "app" / "src" / "main" / "res"
MARSH = (30, 42, 34, 255)
GOLD = (255, 201, 60, 255)
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

js = (ROOT / "game" / "assets.js").read_text(encoding="utf-8")
assets = json.loads(js[js.index("{"): js.rindex("}") + 1])
uri = assets["images"]["hero-sword"]
hero = Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1]))).convert("RGBA")
hero = hero.crop(hero.getchannel("A").getbbox())


def fit(img, box):
    s = box / max(img.size)
    return img.resize((round(img.width * s), round(img.height * s)), Image.Resampling.LANCZOS)


for name, k in DENSITIES.items():
    out = RES / f"mipmap-{name}"
    out.mkdir(parents=True, exist_ok=True)
    size = round(108 * k)
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    art = fit(hero, round(size * 0.6))
    fg.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
    fg.save(out / "ic_launcher_foreground.png")
    size = round(48 * k)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(icon)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.22), fill=MARSH)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.22), outline=GOLD, width=max(1, round(k)))
    art = fit(hero, round(size * 0.82))
    icon.paste(art, ((size - art.width) // 2, size - art.height - round(size * 0.05)), art)
    icon.save(out / "ic_launcher.png")
print("icons written")
