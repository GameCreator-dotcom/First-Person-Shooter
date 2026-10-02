import * as THREE from "three";

const gameContainer = document.querySelector("#game");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x879b9a);
scene.fog = new THREE.Fog(0x879b9a, 32, 100);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  120,
);
camera.position.set(0, 1.7, 8);
camera.lookAt(0, 1.7, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
gameContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.HemisphereLight(0xdce9dc, 0x39443b, 2.1);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffe5bd, 2.4);
sunlight.position.set(-8, 14, 6);
scene.add(sunlight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({
    color: 0x596b59,
    roughness: 0.92,
    metalness: 0.02,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

const grid = new THREE.GridHelper(200, 100, 0x9cab86, 0x788773);
grid.position.y = 0.015;
grid.material.transparent = true;
grid.material.opacity = 0.2;
scene.add(grid);

const movementSpeed = 6;
const pressedKeys = new Set();
const clock = new THREE.Clock();

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
    pressedKeys.add(key);
  }
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => pressedKeys.clear());

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function updateMovement(deltaTime) {
  const forward = Number(pressedKeys.has("w")) - Number(pressedKeys.has("s"));
  const sideways = Number(pressedKeys.has("d")) - Number(pressedKeys.has("a"));
  const directionLength = Math.hypot(forward, sideways);

  if (directionLength === 0) return;

  const distance = (movementSpeed * deltaTime) / directionLength;
  camera.position.x += sideways * distance;
  camera.position.z -= forward * distance;
}

function animate() {
  const deltaTime = Math.min(clock.getDelta(), 0.05);
  updateMovement(deltaTime);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);