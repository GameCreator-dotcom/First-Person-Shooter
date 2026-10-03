import * as THREE from "three";

const gameContainer = document.querySelector("#game");
const gameShell = document.querySelector(".game-shell");

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
let cameraYaw = 0;
let playerYaw = 0;
let cameraPitch = 0;
const mouseSensitivity = 0.003;
let thirdPersonDistance = 7.5;
const minimumThirdPersonDistance = 3.5;
const maximumThirdPersonDistance = 16;
const desiredCameraPosition = new THREE.Vector3();
const desiredCameraTarget = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const thirdPersonCameraSideOffset = 4.5;

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
    pressedKeys.add(key);
  }

  if (key === "v" && !event.repeat) {
    isThirdPerson = !isThirdPerson;
    player.visible = isThirdPerson;
    gameShell.classList.toggle("third-person", isThirdPerson);
  }
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.key.toLowerCase());
});

renderer.domElement.addEventListener("click", () => {
  if (document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock()?.catch(() => {});
  }
});

renderer.domElement.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  cameraYaw += event.movementX * mouseSensitivity;
  cameraPitch -= event.movementY * mouseSensitivity;

  const minimumPitch = isThirdPerson ? -0.05 : -1.4;
  const maximumPitch = isThirdPerson ? 1.35 : 1.4;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch, minimumPitch, maximumPitch);
  cameraYaw = THREE.MathUtils.euclideanModulo(cameraYaw, Math.PI * 2);
});

renderer.domElement.addEventListener("wheel", (event) => {
  if (!isThirdPerson) return;

  event.preventDefault();
  thirdPersonDistance = THREE.MathUtils.clamp(
    thirdPersonDistance + event.deltaY * 0.01,
    minimumThirdPersonDistance,
    maximumThirdPersonDistance,
  );
}, { passive: false });

document.addEventListener("pointerlockchange", () => {
  const isPointerLocked = document.pointerLockElement === renderer.domElement;
  gameShell.classList.toggle("pointer-locked", isPointerLocked);
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
  const orbitDirection = isThirdPerson ? -1 : 1;
  const worldX = orbitDirection * Math.sin(cameraYaw) * forward + Math.cos(cameraYaw) * sideways;
  const worldZ = -Math.cos(cameraYaw) * forward + orbitDirection * Math.sin(cameraYaw) * sideways;
  player.position.x += worldX * distance;
  player.position.z += worldZ * distance;

  playerYaw = Math.atan2(worldX, worldZ);
  player.rotation.y = playerYaw;
}

function updateCamera(deltaTime) {
  if (!isThirdPerson) {
    camera.position.set(player.position.x, 1.7, player.position.z);
    const lookDirection = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch),
      Math.sin(cameraPitch),
      -Math.cos(cameraYaw) * Math.cos(cameraPitch),
    );
    camera.lookAt(camera.position.clone().add(lookDirection));
    return;
  }

  cameraRight.set(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
  cameraForward.set(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));

  const orbitDistance = Math.cos(cameraPitch) * thirdPersonDistance;
  desiredCameraPosition.copy(player.position);
  desiredCameraPosition.addScaledVector(cameraForward, -orbitDistance);
  desiredCameraPosition.addScaledVector(cameraRight, thirdPersonCameraSideOffset);
  desiredCameraPosition.y += 1.1 + Math.sin(cameraPitch) * thirdPersonDistance;

  desiredCameraTarget.copy(player.position);
  desiredCameraTarget.addScaledVector(cameraForward, 2.6);
  desiredCameraTarget.y += 0.85 + Math.sin(cameraPitch) * 1.4;

  const cameraSmoothing = 1 - Math.exp(-deltaTime * 16);
  camera.position.lerp(desiredCameraPosition, cameraSmoothing);
  camera.lookAt(desiredCameraTarget);
}

function animate() {
  const deltaTime = Math.min(clock.getDelta(), 0.05);
  updateMovement(deltaTime);
  updateCamera(deltaTime);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);