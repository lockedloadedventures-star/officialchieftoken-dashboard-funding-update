
// Complete implementation for Day 6 MP4 reel automation
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Update these paths to your actual assets

// To automate for Day 7, duplicate this block and adjust the content/paths as needed.
const day = process.argv[2] || '6';
let assets, backgroundMusic, OUTPUT_PATH;
if (day === '7') {
  OUTPUT_PATH = path.join(os.homedir(), 'Downloads', 'chief-token-reel-day7.mp4');
  assets = [
    {
      image: 'chiefcoinlogo/day7_scene1.jpg',
      text: 'Still watching from the sidelines?',
      duration: 2,
    },
    {
      image: 'chiefcoinlogo/day7_scene2.jpg',
      text: 'Don\'t just watch—participate.',
      duration: 3,
    },
    {
      image: 'chiefcoinlogo/day7_scene3.jpg',
      text: 'Our community wins together.',
      duration: 2,
    },
    {
      image: 'chiefcoinlogo/day7_scene4.jpg',
      text: 'Follow for daily signals!',
      duration: 2,
    },
    {
      image: 'chiefcoinlogo/day7_scene5.jpg',
      text: 'Not financial advice. For education only.',
      duration: 1,
      fontSize: 24,
    },
  ];
  backgroundMusic = 'voiceovers/day7-music.mp3';
} else {
  OUTPUT_PATH = path.join(os.homedir(), 'Downloads', 'chief-token-reel-day6.mp4');
  assets = [
    {
      image: 'chiefcoinlogo/scene1.jpg',
      text: 'Looking for your next edge?',
      duration: 2,
    },
    {
      image: 'chiefcoinlogo/scene2.jpg',
      text: 'CHIEF is not hype-first.',
      duration: 3,
    },
    {
      image: 'chiefcoinlogo/scene3.jpg',
      text: 'We are process-first.',
      duration: 2,
    },
    {
      image: 'chiefcoinlogo/scene4.jpg',
      text: 'Drop CHIEF in the comments if you want the next signal update!',
      duration: 2,
    },
    {
      image: 'chiefcoinlogo/scene5.jpg',
      text: 'Educational only. Not financial advice.',
      duration: 1,
      fontSize: 24,
    },
  ];
  backgroundMusic = 'voiceovers/day6-music.mp3';
}

const TMP_DIR = path.join(__dirname, 'tmp_day6_reel');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

function createSceneVideo(scene, idx) {
  return new Promise((resolve, reject) => {
    const output = path.join(TMP_DIR, `scene${idx + 1}.mp4`);
    let command = ffmpeg(scene.image)
      .loop(scene.duration)
      .videoFilters([
        {
          filter: 'scale',
          options: '576:1024', // 9:16 vertical
        },
        {
          filter: 'drawtext',
          options: {
            fontfile: process.platform === 'win32' ? 'C:/Windows/Fonts/arialbd.ttf' : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            text: scene.text,
            fontsize: scene.fontSize || 36,
            fontcolor: 'white',
            x: '(w-text_w)/2',
            y: 'h-100',
            box: 1,
            boxcolor: 'black@0.5',
            boxborderw: 10,
            shadowcolor: 'black',
            shadowx: 2,
            shadowy: 2,
            enable: `between(t,0,${scene.duration})`,
          },
        },
      ])
      .outputOptions('-t', scene.duration)
      .output(output)
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

async function main() {
  // 1. Create video for each scene
  const sceneVideos = [];
  for (let i = 0; i < assets.length; i++) {
    console.log(`Rendering scene ${i + 1}...`);
    sceneVideos.push(await createSceneVideo(assets[i], i));
  }

  // 2. Concatenate all scenes
  const concatList = path.join(TMP_DIR, 'concat.txt');
  fs.writeFileSync(concatList, sceneVideos.map(f => `file '${f}'`).join('\n'));

  const concatOutput = path.join(TMP_DIR, 'all_scenes.mp4');
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatList)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions(['-c', 'copy'])
      .output(concatOutput)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // 3. Add background music
  await new Promise((resolve, reject) => {
    ffmpeg(concatOutput)
      .input(backgroundMusic)
      .outputOptions([
        '-shortest',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
      ])
      .output(OUTPUT_PATH)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  console.log('Day 6 reel created at:', OUTPUT_PATH);
}

main().catch(e => {
  console.error('Error:', e);
});
