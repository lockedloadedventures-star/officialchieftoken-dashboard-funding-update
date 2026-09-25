from __future__ import annotations

import math
import os
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
    candidates = []
    if os.name == "nt":
        if bold:
            candidates.extend(
                [
                    "C:/Windows/Fonts/arialbd.ttf",
                    "C:/Windows/Fonts/seguibl.ttf",
                    "C:/Windows/Fonts/impact.ttf",
                ]
            )
        candidates.extend(["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf"])

    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                pass

    return ImageFont.load_default()


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def draw_gradient(draw: ImageDraw.ImageDraw, c1: tuple[int, int, int], c2: tuple[int, int, int]) -> None:
    for y in range(HEIGHT):
        t = y / max(HEIGHT - 1, 1)
        r = int(lerp(c1[0], c2[0], t))
        g = int(lerp(c1[1], c2[1], t))
        b = int(lerp(c1[2], c2[2], t))
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))


def draw_text_centered(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    fill: tuple[int, int, int] = (255, 255, 255),
) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    x = (WIDTH - w) // 2
    draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=fill)


def make_chieftoken_frame(i: int) -> Image.Image:
    t = i / FPS
    phase = i / TOTAL_FRAMES

    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_gradient(draw, (22, 10, 6), (9, 41, 51))

    wave = int(25 * math.sin(phase * math.pi * 2))
    draw.ellipse((70 + wave, 90, 650 + wave, 650), outline=(248, 180, 64), width=7)
    draw.ellipse((110 - wave, 130, 610 - wave, 610), outline=(65, 223, 211), width=5)

    font_h1 = load_font(72, bold=True)
    font_h2 = load_font(94, bold=True)
    font_body = load_font(42, bold=True)
    font_small = load_font(28)

    draw_text_centered(draw, "CHIEF TOKEN", 170, font_h1, fill=(255, 245, 225))
    draw_text_centered(draw, "DAY 8", 255, font_h2, fill=(251, 191, 36))

    if t < 3.2:
        body = "SIGNAL BEATS NOISE"
    elif t < 6.8:
        body = "BUILD WITH A SYSTEM"
    else:
        body = "FOLLOW + COMMENT SIGNAL"

    draw.rounded_rectangle((55, 760, WIDTH - 55, 975), radius=28, fill=(8, 16, 24), outline=(255, 242, 216), width=2)
    draw_text_centered(draw, body, 832, font_body, fill=(244, 247, 250))

    pulse = 0.7 + 0.3 * (0.5 + 0.5 * math.sin(phase * math.pi * 8))
    bar_w = int((WIDTH - 110) * pulse)
    draw.rounded_rectangle((55, 1020, 55 + bar_w, 1050), radius=15, fill=(251, 191, 36))
    draw.rounded_rectangle((55, 1020, WIDTH - 55, 1050), radius=15, outline=(251, 191, 36), width=2)

    draw_text_centered(draw, "Educational only. Not financial advice.", 1150, font_small, fill=(218, 228, 239))
    return img


def make_ai_avatar_frame(i: int) -> Image.Image:
    t = i / FPS
    phase = i / TOTAL_FRAMES

    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_gradient(draw, (7, 17, 34), (20, 62, 94))

    for k in range(7):
        x = 70 + k * 95 + int(16 * math.sin(phase * math.pi * 2 + k))
        y = 120 + int(12 * math.cos(phase * math.pi * 3 + k))
        draw.rounded_rectangle((x, y, x + 58, y + 58), radius=14, outline=(74, 222, 241), width=3)

    font_h1 = load_font(64, bold=True)
    font_h2 = load_font(84, bold=True)
    font_body = load_font(40, bold=True)
    font_small = load_font(27)

    draw_text_centered(draw, "AI AVATAR COURSE", 170, font_h1, fill=(220, 242, 255))
    draw_text_centered(draw, "DAY 8", 250, font_h2, fill=(103, 232, 249))

    if t < 3.2:
        body = "48 HOURS BEFORE PRICE LIFT"
    elif t < 6.8:
        body = "NICHE. CONTENT. MONETIZE."
    else:
        body = "COMMENT READY FOR DETAILS"

    draw.rounded_rectangle((55, 760, WIDTH - 55, 975), radius=28, fill=(8, 20, 34), outline=(194, 255, 254), width=2)
    draw_text_centered(draw, body, 832, font_body, fill=(241, 249, 255))

    fill_ratio = min(1.0, (i + 1) / TOTAL_FRAMES)
    bar_w = int((WIDTH - 110) * fill_ratio)
    draw.rounded_rectangle((55, 1020, 55 + bar_w, 1050), radius=15, fill=(34, 211, 238))
    draw.rounded_rectangle((55, 1020, WIDTH - 55, 1050), radius=15, outline=(34, 211, 238), width=2)

    draw_text_centered(draw, "Offer terms apply. Educational content.", 1150, font_small, fill=(203, 229, 247))
    return img


def render_video(output_path: Path, frame_builder) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with imageio.get_writer(output_path.as_posix(), fps=FPS, codec="libx264", quality=8, pixelformat="yuv420p") as writer:
        for i in range(TOTAL_FRAMES):
            frame = frame_builder(i)
            writer.append_data(np.asarray(frame, dtype=np.uint8))


def main() -> None:
    downloads = Path.home() / "Downloads"
    chief_out = downloads / "chieftoken-day8-reel.mp4"
    avatar_out = downloads / "ai-avatar-course-day8-reel.mp4"

    print(f"Rendering: {chief_out}")
    render_video(chief_out, make_chieftoken_frame)
    print(f"Rendering: {avatar_out}")
    render_video(avatar_out, make_ai_avatar_frame)

    print("Done")
    print(chief_out)
    print(avatar_out)


if __name__ == "__main__":
    main()
