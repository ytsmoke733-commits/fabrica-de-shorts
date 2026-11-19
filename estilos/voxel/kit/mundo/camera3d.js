// Aplica uma câmera nomeada (cameras.mjs devolve { pos, look, roll }) a uma PerspectiveCamera do three.js.
export function aplicarCamera(cam, { pos, look, roll = 0 }) {
  cam.position.set(...pos); cam.lookAt(...look);
  if (roll) cam.rotateZ(roll * Math.PI / 180);
  cam.updateProjectionMatrix();
}
