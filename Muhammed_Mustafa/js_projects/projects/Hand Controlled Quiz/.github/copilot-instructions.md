# Hand Controlled Quiz - AI Agent Instructions

## Project Overview
**Hand Controlled Quiz** is an interactive Turkish-language educational quiz game using **gesture-based hand tracking** (MediaPipe HandLandmarker) instead of traditional mouse/keyboard input. Players hover their index finger over answer buttons for ~1 second to select responses. The app includes visual feedback (color transitions), audio cues, and AI "avatar" personalities who comment on performance.

## Architecture

### Core Components

1. **`index.html`** - UI Layer
   - Single-page quiz container with two answer buttons
   - Canvas overlay (flipped) for hand landmark visualization
   - Avatar box (right side) showing character feedback
   - Animated background with floating colored balls
   - CSS-based state management: `.correct` / `.wrong` body classes for visual feedback

2. **`script.js`** - Main Controller (378 lines)
   - **Initialization**: `setupCamera()` (getUserMedia), `loadHandLandmarker()` (MediaPipe model)
   - **Detection loop**: `detectHands()` → continuous canvas rendering + finger tracking
   - **Game flow**: `setupQuestion()` → randomizes answer order → `checkAnswer()` → loops or restarts
   - **Touch detection**: Compares index finger position (landmark 8) against button bounding rects
   - **Interaction state machine**: `isTouching` → `clicked` → 1-second timeout → `object.click()`

3. **`questions.js`** - Content Module (515 lines)
   - Exported array of 60 quiz questions (Math, Physics, Turkish, Biology, History, Geography)
   - Each question: `{ question, options: [choice1, choice2], answer }`
   - Questions are randomized per-game but follow subject groupings

4. **`images/`, `sounds/`** - Static Assets
   - Avatar images (6 Turkish personas: Koç Taylan, Bilgin Bülent, Emine Teyze, etc.)
   - Audio files: `correctAnswerSound.wav`, `wrongAnswerSound.wav`

## Key Patterns & Workflows

### Hand Tracking Detection
```javascript
// Inside detectHands() loop:
const indexFingerTip = landmarks[8];  // Index finger tip
// Get canvas position, convert to screen coordinates
const fingerX = canvasRect.left + (1 - indexFingerTip.x) * canvasRect.width;  // Note: 1 - x because canvas is flipped
const fingerY = canvasRect.top + indexFingerTip.y * canvasRect.height;
// Check collision with interactableObjects (reply1, reply2)
```
**Important**: Canvas is horizontally flipped (`transform: scaleX(-1)`) for mirror-camera view. Always convert normalized MediaPipe coordinates (0-1) to screen space using `getBoundingClientRect()`.

### State Management
- **Game state**: `questionNumber`, `hasAnswered` (prevents duplicate submissions)
- **Interaction state**: `isTouching`, `clicked`, `isReadyHand` (blocks detection during transitions), `handTimeOut`
- **Visual state**: Body classes (`correct`/`wrong`) trigger CSS transitions and play audio
- **Avatar**: Randomly selected from 6 persona objects; shown only on correct answers

### Question Flow
1. `setupQuestion()` - Load current Q, randomize button order, reset styles
2. User hovers finger 1000ms over button → `handTimeOut` fires → `object.click()`
3. `checkAnswer()` → Update score, trigger avatar/sound, add body class
4. 3-second delay → `setupQuestion()` for next Q (loops after 60 questions)

### Styling & Animations
- **Dark theme**: Color values `1e1e2f` (bg), `2c2c3e` (container), `4e5af7` (button blue)
- **Feedback colors**: Color values `2e7d57` (correct), `7d2e3f` (wrong), `a0a6f1` (hover)
- **Background**: CSS animations on `.ball` elements (random colors, float direction, 2000ms duration)

## Development Patterns

### Adding Questions
- Edit `questions.js`: Append object with `{ question: "...", options: ["A", "B"], answer: "A" }`
- Questions must have exactly 2 options
- Button order randomizes automatically via `Math.random()`

### Adding Avatars
- Extend `avatars` array in `script.js` with `{ name, image, messages: [...] }`
- Images placed in `images/` folder
- Messages display on correct answers only (Turkish text for thematic consistency)

### Debugging Hand Detection
- Check console for `"Kamera Erişimi Reddedildi"` (camera access denied)
- Verify MediaPipe model loads (check browser Network tab for WASM + `.task` file)
- Canvas shows hand skeleton in green; red circle on index finger tip
- Collision detection uses button `getBoundingClientRect()` (account for zoom/scroll)

### Visual Feedback Workflow
1. User touches button → highlight to color `a0a6f1` + `clicked = true`
2. After 1 second → `object.click()` fires → `checkAnswer()`
3. Correct: body becomes color `2e7d57`, avatar shows, sound plays
4. Wrong: body becomes color `7d2e3f`, avatar hidden, sound plays
5. After 3 seconds: body returns to default, next question loads

## Critical Details

### Canvas Coordinate Transform
- MediaPipe returns normalized coords (0–1)
- Must account for canvas being **flipped horizontally** (`transform: scaleX(-1)`)
- Conversion: `fingerX = canvasRect.left + (1 - normalizedX) * canvasRect.width`
- Without this, hover detection will be mirrored

### Touch Timeout Logic
```javascript
// 1-second threshold before registering a "click"
handTimeOut = setTimeout(() => {
    if (isTouching) { object.click(); }
}, 1000);
```
This prevents accidental selections while allowing finger repositioning.

### MediaPipe Model Specifics
- `minHandDetectionConfidence: 0.9` - High threshold (stricter detection)
- `numHands: 1` - Detects only one hand; ignores others
- `runningMode: "VIDEO"` - Optimized for continuous frame processing
- Landmarks: 21 points per hand; index 8 = index finger tip; 4, 12, 16, 20 = thumb/finger base points

## Testing & Iteration
- **Manual testing**: Run locally, test hand tracking in different lighting
- **Question balance**: All 60 questions should render without overflow
- **Performance**: Monitor canvas redraw rate in DevTools (target 60 FPS)
- **Accessibility**: Audio warnings for incorrect answers aid auditory feedback; consider alt text for images

## File Dependencies
- `script.js` imports from `questions.js` and uses MediaPipe CDN
- `index.html` must load `script.js` as module: `<script type="module" src="./script.js"></script>`
- All static assets (`images/`, `sounds/`) relative to root directory
