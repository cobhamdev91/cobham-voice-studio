"""Vẽ logo Cobham Studio: nền bo góc gradient emerald, chữ CS + sóng âm.

Dùng:  python assets/brand/make_logo.py [đường/dẫn/ra.png]
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else "cobham-studio-logo.png"
S = 1024
K = 4  # supersample cho cạnh mịn
W = S * K

# Ưu tiên font đậm sẵn có trên máy, không phụ thuộc Windows.
FONT_CANDIDATES = [
    "C:/Windows/Fonts/seguibl.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default(size)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


top, bot = (16, 185, 129), (13, 116, 144)  # emerald-500 -> teal/cyan đậm
grad = Image.new("RGB", (W, W))
gd = ImageDraw.Draw(grad)
for y in range(W):
    gd.line([(0, y), (W, y)], fill=lerp(top, bot, y / (W - 1)))

mask = Image.new("L", (W, W), 0)
margin = 40 * K
ImageDraw.Draw(mask).rounded_rectangle(
    [margin, margin, W - margin, W - margin], radius=220 * K, fill=255)

img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
img.paste(grad, (0, 0), mask)
d = ImageDraw.Draw(img)

# Chữ "CS" (Cobham Studio)
font = load_font(330 * K)
text = "CS"
bbox = d.textbbox((0, 0), text, font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
tx = (W - tw) / 2 - bbox[0]
ty = 250 * K - bbox[1]
d.text((tx, ty), text, font=font, fill="white")

# Sóng âm: các thanh bo tròn, cao dần vào giữa
heights = [70, 140, 230, 300, 230, 140, 70]
bar_w, gap = 56 * K, 34 * K
total = len(heights) * bar_w + (len(heights) - 1) * gap
x = (W - total) / 2
cy = 740 * K
for h in heights:
    h *= K
    d.rounded_rectangle([x, cy - h / 2, x + bar_w, cy + h / 2],
                        radius=bar_w / 2, fill=(255, 255, 255, 235))
    x += bar_w + gap

img.resize((S, S), Image.LANCZOS).save(OUT)
print("ok", OUT)
