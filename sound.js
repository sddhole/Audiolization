import { hslToRgb } from './utils.js';

const WIDTH = 1500;
const HEIGHT = 1500;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;
let bufferLength;
let analyzer;

function handleError(err) {
  console.log('You must give access to your mic in order to proceed');
}
async function getAudio() {
  const stream = await navigator.mediaDevices
    .getUserMedia({ audio: true })
    .catch(handleError);
  const audioCtx = new AudioContext();
  analyzer = audioCtx.createAnalyser();
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyzer);
  // how much data should we collect
  // 2^10
  analyzer.fftSize = 2 ** 8;
  bufferLength = analyzer.frequencyBinCount;
  // data from the analyzer is 8bit
  const timeData = new Uint8Array(bufferLength);
  const frequencyData = new Uint8Array(bufferLength);
  drawTimeData(timeData);
  drawFrequency(frequencyData);
}
function drawTimeData(timeData) {
  analyzer.getByteTimeDomainData(timeData);
  // visualize the data
  // 1.clear the canvas
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // 2.setup the canvas drawing
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#EE9FFF';
  ctx.beginPath();
  const sliceWidth = WIDTH / bufferLength;
  let x = 0;
  timeData.forEach((data, i) => {
    const v = data / 128;
    const y = (v * HEIGHT) / 2;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  });
  ctx.stroke();
  requestAnimationFrame(() => drawTimeData(timeData));
}
function drawFrequency(frequencyData) {
  analyzer.getByteFrequencyData(frequencyData);
  const barWidth = WIDTH / bufferLength;

  let x = 0;
  frequencyData.forEach((amount) => {
    // 0 to 255 frequency
    const percent = amount / 255;
    const [h, s, l] = [360 / (percent * 360) - 0.5, 0.8, 0.5];
    const [r, g, b] = hslToRgb(h, s, l);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    const barHeight = (HEIGHT * percent) / 2;
    // convert the color to HSL
    ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  });

  requestAnimationFrame(() => drawFrequency(frequencyData));
}
getAudio();
