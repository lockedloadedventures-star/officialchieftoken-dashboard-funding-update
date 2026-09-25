from __future__ import annotations

import math
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont

WIDTH = 720
HEIGHT = 1280
FPS = 24
DURATION_SEC = 10
TOTAL_FRAMES = FPS * DURATION_SEC


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates: list[str] = []
    if bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/arialbd.ttf",
                "C:/Windows/Fonts/impact.ttf",
                "C:/Windows/Fonts/seguibl.ttf",
            ]
        )
    candidates.extend(["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf"])

    for p in candidates:
        path = Path(p)
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_gradient(draw: ImageDraw.ImageDraw, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> None:
    for y in range(HEIGHT):
        t = y / max(HEIGHT - 1, 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))


def draw_center(draw: ImageDraw.ImageDraw, text: str, y: int, font, fill=(255, 255, 255)) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    x = (WIDTH - w) // 2
    draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=fill)


def chieftoken_frame(i: int) -> Image.Image:
    t = i / FPS
    p = i / TOTAL_FRAMES

    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_gradient(draw, (24, 8, 3), (10, 45, 50))

    swing = int(24 * math.sin(p * math.pi * 2))
    draw.ellipse((70 + swing, 100, 650 + swing, 680), outline=(251, 191, 36), width=6)
    draw.ellipse((115 - swing, 145, 605 - swing, 635), outline=(45, 212, 191), width=5)

    h1 = load_font(64, True)
    h2 = load_font(84, True)
    body = load_font(40, True)
    small = load_font(27)

    draw_center(draw, "CHIEF TOKEN", 168, h1, fill=(255, 239, 213))
    draw_center(draw, "WEEKLY SIGNAL", 252, h2, fill=(251, 191, 36))

    if t < 3.2:
        line = "CUT THE NOISE"
    elif t < 6.8:
        line = "STACK A REAL SYSTEM"
    else:
        line = "FOLLOW + COMMENT CHIEF"

    draw.rounded_rectangle((55, 770, WIDTH - 55, 980), radius=28, fill=(8, 17, 23), outline=(255, 241, 212), width=2)
    draw_center(draw, line, 842, body, fill=(244, 247, 250))

    pulse = 0.6 + 0.4 * (0.5 + 0.5 * math.sin(p * math.pi * 10))
    bar_w = int((WIDTH - 110) * pulse)
    draw.rounded_rectangle((55, 1020, 55 + bar_w, 1052), radius=15, fill=(251, 191, 36))
    draw.rounded_rectangle((55, 1020, WIDTH - 55, 1052), radius=15, outline=(251, 191, 36), width=2)

    draw_center(draw, "Educational only. Not financial advice.", 1152, small, fill=(217, 230, 240))
    return img


def ai_avatar_frame(i: int) -> Image.Image:
    t = i / FPS
    p = i / TOTAL_FRAMES

    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_gradient(draw, (5, 14, 29), (20, 62, 100))

    for k in range(8):
        x = 42 + k * 83 + int(11 * math.sin(p * math.pi * 2 + k))
        y = 135 + int(10 * math.cos(p * math.pi * 2.5 + k))
        draw.rounded_rectangle((x, y, x + 56, y + 56), radius=12, outline=(99, 235, 255), width=3)

    h1 = load_font(58, True)
    h2 = load_font(82, True)
    body = load_font(38, True)
    small = load_font(26)

    draw_center(draw, "AI AVATAR COURSE", 176, h1, fill=(222, 243, 255))
    draw_center(draw, "BUILD THE ENGINE", 252, h2, fill=(103, 232, 249))

    if t < 3.2:
        line = "SIMPLE CONTENT SYSTEM"
    elif t < 6.8:
        line = "POST DAILY, SELL WEEKLY"
    else:
        line = "COMMENT READY TO JOIN"

    draw.rounded_rectangle((55, 770, WIDTH - 55, 980), radius=28, fill=(7, 21, 39), outline=(199, 248, 255), width=2)
    draw_center(draw, line, 842, body, fill=(242, 249, 255))

    ratio = (i + 1) / TOTAL_FRAMES
    bar_w = int((WIDTH - 110) * ratio)
    draw.rounded_rectangle((55, 1020, 55 + bar_w, 1052), radius=15, fill=(34, 211, 238))
    draw.rounded_rectangle((55, 1020, WIDTH - 55, 1052), radius=15, outline=(34, 211, 238), width=2)

    draw_center(draw, "Educational content. Offer terms apply.", 1152, small, fill=(201, 228, 246))
    return img


def render_video(output: Path, frame_fn) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with imageio.get_writer(output.as_posix(), fps=FPS, codec="libx264", quality=8, pixelformat="yuv420p") as writer:
        for idx in range(TOTAL_FRAMES):
            frame = frame_fn(idx)
            writer.append_data(np.asarray(frame, dtype=np.uint8))


def main() -> None:
    downloads = Path.home() / "Downloads"
    chief = downloads / "chieftoken-day10-reel.mp4"
    avatar = downloads / "ai-avatar-course-day10-reel.mp4"

    print(f"Rendering: {chief}")
    render_video(chief, chieftoken_frame)

    print(f"Rendering: {avatar}")
    render_video(avatar, ai_avatar_frame)

    print("Done")
    print(chief)
    print(avatar)


if __name__ == "__main__":
    main()
