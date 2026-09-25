// ChiefToken Reel Automation Script Template
// This script prepares your daily reel assets and integrates with AI voiceover and Canva (or other video APIs)
// Fill in your API keys and asset paths as needed

const fs = require('fs');
const axios = require('axios');

// === CONFIGURATION ===
const VOICEOVER_API_KEY = 'AIzaSyC7NEJOaPsM7S6iA10VQOUahzg4snZdPes'; // Google Cloud API Key
const VOICEOVER_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${VOICEOVER_API_KEY}`;

const CANVA_BULK_CSV_PATH = './scripts/canva-bulk-reel-next3.csv';
const OUTPUT_AUDIO_DIR = './scripts/voiceovers/';
if (!fs.existsSync(OUTPUT_AUDIO_DIR)) fs.mkdirSync(OUTPUT_AUDIO_DIR, { recursive: true });

// === NEXT 3 REELS DATA ===
const reels = [
  {
    script: "Sunday reset—my routine for a new week. #SelfCareSunday",
    overlay: "Reset for the week!",
    visual: "https://yourdomain.com/assets/chieftoken-reset.png"
  },
  {
    script: "Shoutout to a creator who inspires me—go follow them! #Community",
    overlay: "Community love!",
    visual: "https://yourdomain.com/assets/chieftoken-community.png"
  },
  {
    script: "My favorite spiritual practice—try it and let me know how it goes. #SpiritualJourney",
    overlay: "Spiritual journey!",
    visual: "https://yourdomain.com/assets/chieftoken-spiritual.png"
  },
  {
    script: "Before/after transformation—proof that change is possible. #TransformationTuesday",
    overlay: "Transformation!",
    visual: "https://yourdomain.com/assets/chieftoken-transformation.png"
  },
  {
    script: "Workout challenge! Tag me if you try it. #ChallengeAccepted",
    overlay: "Challenge accepted!",
    visual: "https://yourdomain.com/assets/chieftoken-challenge.png"
  },
  {
    script: "Throwback to my oldest tattoo—would I do it again? #TattooFlashback",
    overlay: "Tattoo flashback!",
    visual: "https://yourdomain.com/assets/chieftoken-tattoo.png"
  },
  {
    script: "Thank you for supporting my journey! DM me if you want more. #Gratitude",
    overlay: "Thank you!",
    visual: "https://yourdomain.com/assets/chieftoken-thanks.png"
  },
  {
    script: "Sharing my playlist for workouts/meditation. What’s on yours? #MusicMotivation",
    overlay: "Music motivation!",
    visual: "https://yourdomain.com/assets/chieftoken-music.png"
  },
  {
    script: "Teaser for exclusive content—want the full thing? Link in bio. #Exclusive",
    overlay: "Exclusive drop!",
    visual: "https://yourdomain.com/assets/chieftoken-exclusive.png"
  },
  {
    script: "Follower transformation feature—so proud of this community! #CommunitySpotlight",
    overlay: "Community spotlight!",
    visual: "https://yourdomain.com/assets/chieftoken-spotlight.png"
  },
  {
    script: "Going live for Q&A—set your reminders! #LiveSession",
    overlay: "Live Q&A!",
    visual: "https://yourdomain.com/assets/chieftoken-live.png"
  },
  {
    script: "Myth vs fact: fitness, tattoos, or spirituality—what do you believe? #MythBusting",
    overlay: "Myth busting!",
    visual: "https://yourdomain.com/assets/chieftoken-myth.png"
  },
  {
    script: "Motivation for your feed—let’s crush it today! #DailyMotivation",
    overlay: "Crush it today!",
    visual: "https://yourdomain.com/assets/chieftoken-motivation.png"
  },
  {
    script: "Your feedback matters—what do you want to see next? #Feedback",
    overlay: "Feedback wanted!",
    visual: "https://yourdomain.com/assets/chieftoken-feedback.png"
  },
  {
    script: "Sunday reflection—what are you grateful for? #Gratitude",
    overlay: "Gratitude!",
    visual: "https://yourdomain.com/assets/chieftoken-gratitude.png"
  },
  {
    script: "Giveaway/special offer for my OnlyFans fam—details in bio! #Giveaway",
    overlay: "Giveaway time!",
    visual: "https://yourdomain.com/assets/chieftoken-giveaway.png"
  },
  {
    script: "Thank you for an amazing month! Here’s what’s next—join me on OnlyFans for the full journey. #NextChapter",
    overlay: "Next chapter!",
    visual: "https://yourdomain.com/assets/chieftoken-next.png"
  }
];

// === GENERATE VOICEOVER ===
async function generateVoiceover(text, filename) {
  try {
    const requestBody = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Wavenet-D', // You can change this to another Google TTS voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
      },
    };
    const response = await axios.post(VOICEOVER_API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const audioContent = response.data.audioContent;
    if (!audioContent) throw new Error('No audio content returned from Google TTS');
    fs.writeFileSync(filename, Buffer.from(audioContent, 'base64'));
    console.log('Voiceover audio saved to', filename);
  } catch (error) {
    console.error('Voiceover generation failed:', error.message);
  }
}

// === GENERATE CANVA BULK CSV ===
function generateCanvaCSV(rows) {
  const csv = 'script,overlay_text,visual_asset,audio_asset\n' +
    rows.map(r => `"${r.script}","${r.overlay}","${r.visual}","${r.audio}"`).join('\n');
  fs.writeFileSync(CANVA_BULK_CSV_PATH, csv);
  console.log('Canva bulk CSV saved to', CANVA_BULK_CSV_PATH);
}

// === MAIN ===

// === MAIN ===
(async () => {
  const rows = [];
  for (let i = 0; i < reels.length; i++) {
    const r = reels[i];
    const audioFile = `${OUTPUT_AUDIO_DIR}voiceover${i + 1}.mp3`;
    await generateVoiceover(r.script, audioFile);
    rows.push({ script: r.script, overlay: r.overlay, visual: r.visual, audio: audioFile });
  }
  generateCanvaCSV(rows);
  console.log('All assets ready for Canva bulk upload.');
})();

// === INSTRUCTIONS ===
// 1. Get your API key from ElevenLabs (or Google TTS) and paste it above.
// 2. Run this script: node scripts/generate-reel.js
// 3. Upload the CSV and assets to Canva Bulk Create.
// 4. Canva will generate your reel automatically.
//
// For full automation (uploading to Canva or posting to Instagram/X), use Zapier/Make.com with your Canva and social accounts connected.
