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

const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.35, 0.9, 4, 10),
  new THREE.MeshStandardMaterial({ color: 0x344d45, roughness: 0.8 }),
);
body.position.y = 0.85;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.24, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xc5a77c, roughness: 0.85 }),
);
head.position.y = 1.72;
player.add(head);
player.visible = false;
scene.add(player);

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
let isThirdPerson = false;
const thirdPersonOffset = new THREE.Vector3(0, 3.2, 7.5);
const desiredCameraPosition = new THREE.Vector3();

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
    pressedKeys.add(key);
  }

  if (key === "v" && !event.repeat) {
    isThirdPerson = !isThirdPerson;
    player.visible = isThirdPerson;
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
  player.position.x += sideways * distance;
  player.position.z -= forward * distance;
}

function updateCamera(deltaTime) {
  if (!isThirdPerson) {
    camera.position.set(player.position.x, 1.7, player.position.z);
    camera.lookAt(player.position.x, 1.7, player.position.z - 10);
    return;
  }

  desiredCameraPosition.copy(player.position).add(thirdPersonOffset);
  camera.position.lerp(desiredCameraPosition, Math.min(1, deltaTime * 6));
  camera.lookAt(player.position.x, 1.1, player.position.z);
}

function animate() {
  const deltaTime = Math.min(clock.getDelta(), 0.05);
  updateMovement(deltaTime);
  updateCamera(deltaTime);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);