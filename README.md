# First-Person Shooter

A small browser-based FPS built with HTML, CSS, JavaScript, and Three.js.

## Run locally

1. Install [Node.js 20.19+ or 22.12+](https://nodejs.org/) if it is not already installed.
2. Open this folder in VS Code.
3. In the VS Code terminal, run `npm install` once.
4. Run `npm run dev` and open the local URL printed in the terminal.

### Quick preview without Node.js

If Python 3 is installed, run `python3 -m http.server 8000` and open `http://localhost:8000`. This preview loads Three.js from jsDelivr, so it requires an internet connection.

## Stage 1

The current build contains first-person and third-person camera views, basic lighting, a large arena floor, and WASD movement. Press `V` to switch views. Movement is kept at the same speed in every direction and is independent of frame rate.
