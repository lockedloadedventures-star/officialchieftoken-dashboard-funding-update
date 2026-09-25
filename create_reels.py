from moviepy.editor import *
from gtts import gTTS
import os

# === CONFIGURATION ===
scripts = [
    "ChiefToken is the future of decentralized community rewards. Join us and be part of the movement!",
    "Earn, trade, and participate with ChiefToken. Your gateway to the next generation of DeFi.",
    "ChiefToken: Secure, transparent, and community-driven. Get involved today!"
]
image_folder = "chiefcoinlogo"
output_folder = "reels"
os.makedirs(output_folder, exist_ok=True)

image_files = [os.path.join(image_folder, f) for f in os.listdir(image_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

for idx, script_text in enumerate(scripts):
    image_path = image_files[idx % len(image_files)]
    output_video = os.path.join(output_folder, f"chieftoken_reel_{idx+1}.mp4")
    tts = gTTS(text=script_text, lang='en')
    tts.save("voiceover.mp3")
    image_clip = ImageClip(image_path).set_duration(10).resize(height=720)
    audio_clip = AudioFileClip("voiceover.mp3")
    video = image_clip.set_audio(audio_clip)
    video.write_videofile(output_video, fps=24)
    print("Reel created:", output_video)

os.remove("voiceover.mp3")
