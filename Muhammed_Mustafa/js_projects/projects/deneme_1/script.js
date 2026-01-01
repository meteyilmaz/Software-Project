import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

let currentQuestion = null;
let score = 0;
let questionActive = true;
let lastSelection = null; // {choiceIndex, correct, time}

async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(video);
    });
  } catch (error) {
    console.error("Kamera Erişimi Reddedildi: ", error);
  }
}

let allQuestions = [];

async function loadQuestions() {
  const resp = await fetch("sorular.json");
  allQuestions = await resp.json();
}

function getRandomQuestion() {
  const index = Math.floor(Math.random() * allQuestions.length);
  const q = allQuestions[index];
  return {
    text: q.soru,
    choices: q.secenekler,
    correctIndex: q.dogru,
  };
}

function drawQuestionUI() {
  // Arka plan temizliği ve video görüntüsü zaten çizildiği için burası sadece UI'yı ekler
  // Soru üst kısımda, iki şık alt kısımda kutular halinde
  ctx.save();
  // Soru kutusu
  ctx.fillStyle = "#FFF57E"; // question-box background
  ctx.font = "28px Comic Sans MS, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Soru arkaplan
  const qx = canvas.width / 2;
  const qy = 120;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, 200, qy - 28, canvas.width-400, 56, 12, true, false);
  ctx.fillStyle = "white";
  ctx.fillText(currentQuestion.text, qx, qy);

  // Şık kutuları
  const boxW = 260;
  const boxH = 90;
  const gap = 60; // arayı biraz açtım

  const leftX = canvas.width / 2 - boxW - gap / 2;
  const rightX = canvas.width / 2 + gap / 2;
  const by = canvas.height - 150; // biraz daha yukarı aldım

  // Sol şık
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, leftX, by, boxW, boxH, 16, true, false);
  ctx.fillStyle = "black";
  ctx.font = "40px Comic Sans MS, Arial";
  ctx.fillText(
    String(currentQuestion.choices[0]),
    leftX + boxW / 2,
    by + boxH / 2
  );

  // Sağ şık
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, rightX, by, boxW, boxH, 16, true, false);
  ctx.fillStyle = "black";
  ctx.fillText(
    String(currentQuestion.choices[1]),
    rightX + boxW / 2,
    by + boxH / 2
  );

  // Eğer son seçim varsa kısa geri bildirim göster
  if (lastSelection && performance.now() - lastSelection.time < 1200) {
    ctx.textAlign = "center";
    ctx.font = "84px Arial";
    ctx.fillStyle = lastSelection.correct
      ? "rgba(0,200,0,0.9)"
      : "rgba(200,0,0,0.9)";
    ctx.fillText(
      lastSelection.correct ? "Doğru!" : "Yanlış!",
      canvas.width / 2,
      canvas.height / 2
    );
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === "undefined") r = 5;
  if (typeof r === "number") r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function pointInBox(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

async function loadHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  return await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });
}

async function main() {
  await setupCamera();
  const handLandmarker = await loadHandLandmarker();

  // İlk soru oluştur
  await loadQuestions();
  currentQuestion = getRandomQuestion();

  function drawHands(landmarks) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const utils = new DrawingUtils(ctx);

    utils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
      lineWidth: 20,
    });

    utils.drawLandmarks(landmarks, {
      radius: 15,
    });

    ctx.restore();
  }

  function detectHands() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const results = handLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks) {
      results.landmarks.forEach((landmarks) => {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        const utils = new DrawingUtils(ctx);

        utils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
          lineWidth: 20,
        });

        utils.drawLandmarks(landmarks, {
          radius: 10,
        });

        // Parmak ucu kırmızı
        const indexFingerTip = landmarks[8];
        ctx.beginPath();
        ctx.arc(
          indexFingerTip.x * canvas.width,
          indexFingerTip.y * canvas.height,
          20,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = "red";
        ctx.fill();

        ctx.restore();
        // Ayna düzeltmesi
        const ix = canvas.width - indexFingerTip.x * canvas.width;
        const iy = indexFingerTip.y * canvas.height;

        if (questionActive) {
          const boxW = 260;
          const boxH = 90;
          const gap = 40;
          const leftX = canvas.width / 2 - boxW - gap / 2;
          const rightX = canvas.width / 2 + gap / 2;
          const by = canvas.height - 120;

          if (pointInBox(ix, iy, leftX, by, boxW, boxH)) {
            handleChoice(0);
          } else if (pointInBox(ix, iy, rightX, by, boxW, boxH)) {
            handleChoice(1);
          }
        }
      });
    }

    // UI
    if (currentQuestion) drawQuestionUI();

    requestAnimationFrame(detectHands);
  }

  detectHands();
}

function handleChoice(choiceIndex) {
  // Debounce: bir seçim yaptıktan sonra 2s içinde tekrar seçim olmasın
  if (lastSelection && performance.now() - lastSelection.time < 2000) return;

  const correct = choiceIndex === currentQuestion.correctIndex;
  if (correct) score += 1;
  else score = Math.max(0, score - 0); // istersen negatif ceza veya 0 bırak

  lastSelection = { choiceIndex, correct, time: performance.now() };

  // Kısa süreli görsel geri bildirim için questionActive false yapma
  questionActive = false;
  setTimeout(() => {
    // Yeni soru üret ve tekrar aktif et
    currentQuestion = getRandomQuestion();
    questionActive = true;
  }, 5000);
}

// Başlat
main();
