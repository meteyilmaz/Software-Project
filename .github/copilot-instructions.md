# AI Coding Instructions for Software-Project

## Project Overview
This repository contains **interactive JavaScript/HTML5 applications** combining computer vision (face recognition, hand detection) with games, quizzes, and interactive systems. All projects are **standalone, browser-based applications** without build tools or server dependencies.

## Architecture Patterns

### 1. **Multi-Library Approach for Vision Tasks**
- **Face-based projects** (`Face Recognition`, `Face Detection`, `Face Pay`, `Face Analysis`): Use **face-api.js** library
  - Load models: `await Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri("../models"), ...]).then(main)`
  - Models located at: `../models/` (shared folder from projects directory)
  - Model files follow pattern: `*_model-shard1`, `*_weights_manifest.json`

- **Hand-based projects** (`Hand Controlled Quiz`, `Hand Landmarker`, `Balloon Shooter`): Use **MediaPipe HandLandmarker**
  - Import: `import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest"`
  - Remote CDN loading (no local files)

### 2. **Camera & Canvas Setup (Universal Pattern)**
```javascript
// 1. Request camera access
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;

// 2. Setup canvas overlay
const canvas = document.getElementById("canvas");
canvas.style.position = "absolute";
canvas.style.top = "0";
canvas.style.left = "0";
const displaySize = { width: video.width, height: video.height };
```
- All projects use `video` element for webcam stream + `canvas` for overlays/drawing
- Camera setup includes error handling with Turkish error messages

### 3. **Data Loading Patterns**

**JSON Configuration Files:**
- `students.json`, `users.json`: Static ID→name/metadata mappings
  - Loaded via: `fetch("students.json").then(r => r.json())`
  - Structure: `{ "id": { "name": "X", "surname": "Y", "class": "Z" } }`

**Image Directories:**
- Face projects fetch images from local `./images/` folder
- Custom parser for directory listing (converts folder listing HTML to file array)
- Naming convention: Image filename becomes the label (spaces encoded as `%20`)

**Question/Content Files:**
- `questions.js`: Exported array of question objects
  - Format: `{ question: "text", options: ["A", "B"], answer: "A" }`
  - Used by: Hand Controlled Quiz (515 lines, mixed Turkish/English)

### 4. **Interactive Gesture Handling**

**Hand Detection → Click Simulation:**
- Detect hand landmarks, map to "hovering" over UI elements
- Hold-to-click pattern: Track `touchStartTime` and duration threshold
- Interactable objects array: `interactableObjects = [button1, button2]`
- State tracking: `isTouching`, `isClicked`, `hasAnswered`

**Face Recognition → Identity Matching:**
- Generate face descriptors from training images
- Use `FaceMatcher` to match against live video descriptors
- Return matched name with confidence threshold

### 5. **UI & Feedback Patterns**

**Avatar System (Balloon Shooter, Hand Controlled Quiz):**
- Array of avatar objects with `name`, `image`, `messages[]`
- Shows random message on success/failure
- Avatars include: Koç Taylan, Bilgin Bülent, Emine Teyze, Uzaylı Zortax, Ergen Eren, Trol Mehmet

**Status Feedback:**
- Color-coded backgrounds: `body.correct` (green #2e7d57), `body.wrong` (red #7d2e3f)
- Audio cues: `.wav` files in `sounds/` folder
- Progress bars, toast notifications, scoreboards

**Animation Patterns:**
- Background: Randomly animated floating balls (using `element.animate()`)
- Smooth transitions: `transition: background-color 0.5s ease`
- Canvas drawing: `ctx.drawImage()`, landmark visualization, bounding boxes

## File Organization

```
projects/
├── {ProjectName}/
│   ├── index.html           # Entry point, minimal markup
│   ├── script.js            # Main logic (async/await heavy)
│   ├── style.css            # Optional inline or external styles
│   ├── {module}.js          # Data files (questions.js, etc)
│   ├── {config}.json        # Static data (students.json, users.json)
│   ├── images/              # Training images or UI assets
│   └── sounds/              # .wav audio files
├── models/                  # Shared face-api models
├── face-api.min.js          # Shared face-api library
└── ../libs/                 # Backup shared resources
```

## Key Conventions

### **Language Mix**
- **UI/Messages**: Turkish (avatars, error messages)
- **Code Comments**: Minimal, mostly English
- **Question Sets**: Mixed Turkish/English educational content

### **Async/Await Everywhere**
- Top-level `await` used for initialization (setupCamera, loadModels)
- Detection loops: `setInterval(async () => { ... }, framerate)`
- No `.then()` chains; prefer `await`

### **Resource Paths**
- Models: Relative `../models/` (one level up from script folder)
- Images: Relative `./images/` (same folder as script)
- Libraries: Relative `../face-api.min.js` OR CDN imports
- **Important**: Path resolution depends on actual project folder depth

### **Performance Considerations**
- Face detection: Runs every frame in `setInterval()`
- Canvas resizing handled before loop: `faceapi.matchDimensions(canvas, size)`
- Hand detection: Continuous detection from video stream
- No frame dropping logic—relies on browser throttling

### **Browser APIs Used**
- `getUserMedia()`: Camera access (error handling required)
- `Canvas.getContext('2d')`: Drawing/rendering
- `fetch()`: Load models, images, JSON configs
- `DOMParser`: Parse directory HTML listings
- `element.animate()`: CSS animation API (not requestAnimationFrame)

## Development Workflow

1. **Create new project folder** in `projects/`
2. **Use existing template**: Copy `index.html` + `script.js` from similar project
3. **Choose vision task**:
   - Face-based → Include model loading, adjust paths, handle FaceMatcher
   - Hand-based → Use MediaPipe CDN import, handle gesture zones
4. **Add data**: Place images in `images/` or JSON in project root
5. **Test locally**: Open `index.html` in browser, grant camera permission
6. **Debug**: Check browser console for model loading errors, camera access denials

## Common Pitfalls to Avoid

- ❌ Forgetting `faceapi.matchDimensions(canvas, size)` before detection loop
- ❌ Hardcoding absolute paths—use relative paths from each project folder
- ❌ Loading models after detection loop starts (race conditions)
- ❌ Not handling camera permission denial gracefully
- ❌ Assuming folder structure—always verify relative paths match project location
- ❌ Using `require()` or bundler syntax—stick to ES6 `import` and CDN scripts

## External Dependencies

| Dependency | Projects | Loading Method |
|---|---|---|
| face-api.js | Face* projects | Local `../face-api.min.js` |
| MediaPipe HandLandmarker | Hand* projects | CDN `@mediapipe/tasks-vision` |
| Web APIs (getUserMedia, Canvas, Fetch) | All | Native browser |

## Quick Start for New Projects

```javascript
// 1. Setup camera
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
document.getElementById("video").srcObject = stream;

// 2. Load models (face-based)
await Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("../models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("../models")
]).then(() => startDetection());

// 3. Detection loop
setInterval(async () => {
  const detections = await faceapi.detectAllFaces(video).withFaceLandmarks();
  // Process detections...
}, 100);
```

## References

- **Similar Projects**: Check `Face Recognition with Json` for full face matching pipeline
- **Quiz Template**: See `Hand Controlled Quiz` for gesture-to-UI mapping pattern
- **Game Template**: See `Balloon Shooter` for interactive canvas games with gestures
