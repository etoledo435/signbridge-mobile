import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const video = document.getElementById("cam") as HTMLVideoElement;
const canvas = document.getElementById("overlay") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const status = document.getElementById("status")!;

async function start() {
  status.textContent = "Loading MediaPipe WASM...";
  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  status.textContent = "Loading hand model...";
  const landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  status.textContent = "Opening camera...";
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });

  video.srcObject = stream;
  await video.play();

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  let lastTime = -1;
  const loop = () => {
    if (video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      
      // Direktang ginagawa ang hand detection sa loob mismo ng phone
      const res = landmarker.detectForVideo(video, performance.now());

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00e5ff";

      if (res.landmarks && res.landmarks.length > 0) {
        for (const hand of res.landmarks) {
          for (const p of hand) {
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        status.textContent = "Hands detected: " + res.landmarks.length;
      } else {
        status.textContent = "Hands detected: 0";
      }
    }
    requestAnimationFrame(loop);
  };

  loop();
}

start().catch((e) => {
  console.error(e);
  status.textContent = "Error: " + (e.message || e);
});