from __future__ import annotations

from pathlib import Path
import textwrap
import numpy as np

from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import ImageClip, VideoClip, concatenate_videoclips


WIDTH = 1080
HEIGHT = 1920
FPS = 30

BG_DARK = (12, 16, 30)
BG_MID = (20, 52, 120)
ACCENT_GOLD = (255, 214, 0)
WHITE = (245, 247, 255)

DAY5_PALETTE = {
    "bg_top": (12, 16, 30),
    "bg_bottom": (20, 52, 120),
    "accent": (255, 214, 0),
    "title": (245, 247, 255),
    "subtitle": (255, 214, 0),
    "panel": (8, 10, 16),
    "blob": (35, 90, 185),
    "footer": (215, 220, 230),
}

DAY6_PALETTE = {
    "bg_top": (247, 244, 232),
    "bg_bottom": (255, 221, 128),
    "accent": (16, 38, 92),
    "title": (14, 20, 33),
    "subtitle": (16, 38, 92),
    "panel": (235, 201, 110),
    "blob": (252, 241, 205),
    "footer": (27, 38, 60),
}


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/arialbd.ttf",
                "C:/Windows/Fonts/seguisb.ttf",
                "C:/Windows/Fonts/tahomabd.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/segoeui.ttf",
                "C:/Windows/Fonts/tahoma.ttf",
            ]
        )

    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _vertical_gradient(width: int, height: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (width, height), top)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(1, height - 1)
        color = (
            int(top[0] * (1 - t) + bottom[0] * t),
            int(top[1] * (1 - t) + bottom[1] * t),
            int(top[2] * (1 - t) + bottom[2] * t),
        )
        draw.line([(0, y), (width, y)], fill=color)
    return img


def _draw_scene(
    title: str,
    subtitle: str | None,
    footer: str | None,
    out_path: Path,
    palette: dict[str, tuple[int, int, int]],
    title_size: int = 84,
    subtitle_size: int = 52,
    footer_size: int = 36,
) -> None:
    img = _vertical_gradient(WIDTH, HEIGHT, palette["bg_top"], palette["bg_bottom"])
    draw = ImageDraw.Draw(img)

    # Brand accent shapes for depth and motion-like energy.
    draw.ellipse((70, 100, 430, 460), outline=palette["accent"], width=10)
    draw.ellipse((700, 1330, 1080, 1710), fill=palette["blob"])
    draw.rectangle((0, HEIGHT - 250, WIDTH, HEIGHT), fill=palette["panel"])

    title_font = _load_font(title_size, bold=True)
    subtitle_font = _load_font(subtitle_size, bold=True)
    footer_font = _load_font(footer_size, bold=False)

    wrapped_title = "\n".join(textwrap.wrap(title, width=18))
    title_box = draw.multiline_textbbox((0, 0), wrapped_title, font=title_font, spacing=10)
    title_w = title_box[2] - title_box[0]
    title_h = title_box[3] - title_box[1]
    title_x = (WIDTH - title_w) // 2
    title_y = 500 - title_h // 2

    draw.multiline_text(
        (title_x + 3, title_y + 3),
        wrapped_title,
        font=title_font,
        fill=(0, 0, 0),
        spacing=10,
        align="center",
    )
    draw.multiline_text(
        (title_x, title_y),
        wrapped_title,
        font=title_font,
        fill=palette["title"],
        spacing=10,
        align="center",
    )

    if subtitle:
        wrapped_sub = "\n".join(textwrap.wrap(subtitle, width=24))
        sub_box = draw.multiline_textbbox((0, 0), wrapped_sub, font=subtitle_font, spacing=8)
        sub_w = sub_box[2] - sub_box[0]
        sub_x = (WIDTH - sub_w) // 2
        draw.multiline_text(
            (sub_x, 1020),
            wrapped_sub,
            font=subtitle_font,
            fill=palette["subtitle"],
            spacing=8,
            align="center",
        )

    if footer:
        wrapped_footer = "\n".join(textwrap.wrap(footer, width=44))
        draw.multiline_text(
            (70, HEIGHT - 190),
            wrapped_footer,
            font=footer_font,
            fill=palette["footer"],
            spacing=6,
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def _make_wipe_transition(clip_a: ImageClip, clip_b: ImageClip, duration: float = 0.22) -> VideoClip:
    width = clip_a.w

    def make_frame(t: float):
        progress = min(max(t / duration, 0.0), 1.0)
        split = int(width * progress)
        frame_a = clip_a.get_frame(max(clip_a.duration - duration + t, 0.0)).copy()
        frame_b = clip_b.get_frame(t)
        frame_a[:, :split, :] = frame_b[:, :split, :]
        return frame_a

    return VideoClip(make_frame=make_frame, duration=duration)


def _render_reel(
    day_label: str,
    scenes: list[dict[str, object]],
    output_mp4: Path,
    temp_dir: Path,
    palette: dict[str, tuple[int, int, int]],
) -> None:
    frame_paths: list[Path] = []
    clips = []

    for idx, scene in enumerate(scenes, start=1):
        frame_path = temp_dir / f"{day_label.lower()}_scene_{idx}.png"
        _draw_scene(
            title=str(scene["title"]),
            subtitle=str(scene.get("subtitle")) if scene.get("subtitle") else None,
            footer=str(scene.get("footer")) if scene.get("footer") else None,
            out_path=frame_path,
            palette=palette,
            title_size=int(scene.get("title_size", 84)),
            subtitle_size=int(scene.get("subtitle_size", 52)),
            footer_size=int(scene.get("footer_size", 36)),
        )
        frame_paths.append(frame_path)

        clip = ImageClip(str(frame_path)).set_duration(float(scene["duration"]))
        clips.append(clip)

    timeline = []
    for idx, clip in enumerate(clips):
        timeline.append(clip)
        if idx < len(clips) - 1:
            timeline.append(_make_wipe_transition(clip, clips[idx + 1], duration=0.22))

    final = concatenate_videoclips(timeline, method="compose")
    output_mp4.parent.mkdir(parents=True, exist_ok=True)
    final.write_videofile(
        str(output_mp4),
        fps=FPS,
        codec="libx264",
        audio=False,
        preset="medium",
        threads=4,
    )
    final.close()
    for clip in clips:
        clip.close()

    for frame_path in frame_paths:
        try:
            frame_path.unlink()
        except OSError:
            pass


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    reels_dir = root / "reels"
    temp_dir = root / "scripts" / "tmp_day5_day6_reels"
    temp_dir.mkdir(parents=True, exist_ok=True)

    day5_scenes = [
        {"title": "Momentum isn't luck", "subtitle": "It's built.", "duration": 2.0},
        {"title": "Every day more builders", "subtitle": "join ChiefToken", "duration": 2.0},
        {"title": "Ready to level up?", "subtitle": "Tap in.", "duration": 2.0},
        {
            "title": "Follow @officialchieftoken",
            "subtitle": "Be part of the next wave",
            "duration": 2.5,
        },
        {
            "title": "Educational only",
            "subtitle": "Not financial advice",
            "footer": "ChiefToken social reel - Day 5",
            "duration": 1.5,
        },
    ]

    day6_scenes = [
        {"title": "Looking for your next edge?", "subtitle": None, "duration": 2.0},
        {"title": "CHIEF is not hype-first", "subtitle": None, "duration": 3.0},
        {"title": "We are process-first", "subtitle": None, "duration": 2.0},
        {
            "title": "Drop CHIEF in comments",
            "subtitle": "for the next signal update",
            "title_size": 72,
            "subtitle_size": 46,
            "duration": 2.0,
        },
        {
            "title": "Educational only",
            "subtitle": "Not financial advice",
            "footer": "ChiefToken social reel - Day 6",
            "title_size": 68,
            "subtitle_size": 42,
            "footer_size": 34,
            "duration": 1.0,
        },
    ]

    day5_out = reels_dir / "chief-token-day5-reel.mp4"
    day6_out = reels_dir / "chief-token-day6-reel.mp4"

    _render_reel("DAY5", day5_scenes, day5_out, temp_dir, DAY5_PALETTE)
    _render_reel("DAY6", day6_scenes, day6_out, temp_dir, DAY6_PALETTE)

    print(f"Created: {day5_out}")
    print(f"Created: {day6_out}")


if __name__ == "__main__":
    main()
