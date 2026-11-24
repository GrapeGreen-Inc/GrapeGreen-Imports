# 🍇 GrapeGreen Imports Core
### Module Core: `Three-dim.js` (V1 Production Release)

Open-source modular WebGL GPU-accelerated graphics engine running completely on client-side vector mechanics and hardware shaders.

* **Live Module URL:** `https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v1/Three-dim.js`

---

## 🌐 1. Vector Math Core (`Vector3`)
```javascript
import {
  Vector3,
  AllDirLight,
  SpotLight,
  Camera,
  Material,
  ColliderBody,
  MeshObject,
  Raycaster,
  GrapeScene3D,
  initializeScene
} from "https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v1/Three-dim.js";
```
* **`add(v)`**: Vector addition.
* **`sub(v)`**: Vector subtraction.
* **`mult(n)`**: Scalar multiplication.
* **`dot(v)`**: Dot product calculation.
* **`cross(v)`**: Cross product calculation.
* **`magnitude()`**: Vector length calculation.
* **`normalize()`**: Normalizes vector to unit length of 1.

---

## 🎥 2. Camera Platform System (`Camera`)
```javascript
const camera = new Camera(position, yaw, pitch, fov, near, far);
```
* **`position`** (`Vector3`): View location vector (defaults to `(0, 0, -5)`).
* **`yaw`** (`Number`): Left-to-right rotation angle in degrees.
* **`pitch`** (`Number`): Up-and-down tilt angle in degrees.
* **`fov`** (`Number`): Field of view in degrees (defaults to `60`).
* **`near` / `far`** (`Number`): Near and far perspective clipping planes (defaults to `0.1` and `1000.0`).

---

## 🧱 3. Geometric Object Shape Primitives (`MeshObject`)
```javascript
const shape = new MeshObject(type, material);
```
* **Supported primitives**: `box`, `pyramid`, `sphere`, `cylinder` — all pre-built as full `gl.TRIANGLES` vertex meshes via `initGeometry()`.
* **Transform fields**: `position` (`Vector3`), `rotation` (`Vector3` in degrees, where `rotation.y` is **Yaw** and `rotation.x` is **Pitch**), `scale` (`Vector3`).
* **`customPoints`** (`Array`): Flat array of triangle vertex coordinates (`[x1, y1, z1, x2, y2, z2, ...]`).
* **`boundingRadius`** (`Number`): Culling radius used for camera frustum distance checks.
* **`receiveShadows`** (`Boolean`): Toggles real-time spotlight shadow checks on the mesh (defaults to `true`).

---

## 💎 4. Graphics Material Shaders (`Material`)
```javascript
const material = new Material(type, color, roughness, reflectivity);
```
* **`Standard`**: Base directional-lit shading matrix.
* **`Glass`**: Activates alpha-blended fragment translucency calculations.
* **`Metallic`**: Amplifies specular highlight brightness.
* **`color`** (`Object`): RGB object `{ r, g, b }` (defaults to `{ r: 163, g: 230, b: 53 }`).
* **`roughness` / `reflectivity`** (`Number`): Surface material properties (defaults to `0.5` and `0.1`).

---

## 💥 5. Physics & Bounding Colliders (`ColliderBody`)
```javascript
const collider = new ColliderBody(type, radius, size);
```
* **`intersects(other, posA, posB)`**: Returns boolean collision status between two `Sphere` colliders.

---

## 💡 6. Lighting Environments (`AllDirLight` / `SpotLight`)
* **`AllDirLight(direction, color, intensity)`**: Ambient global directional light.
* **`SpotLight(position, direction, angle, color, intensity)`**: Conical target light beam used for shadow casting.

---

## 🎯 7. Interactive Raycasting (`Raycaster`)
```javascript
const raycaster = new Raycaster();
raycaster.setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera);
let hitResult = raycaster.intersectObject(meshObject);
```

---

## 🎬 8. Scene Renderer (`GrapeScene3D` & `initializeScene`)
```javascript
const scene = initializeScene("canvasId");
```
* **`initializeScene(canvasId)`**: Creates a `GrapeScene3D` instance, moves the camera to `(0, 0, -6)`, and adds default directional and spot lights.
* **`addObject(obj)`**: Registers a `MeshObject` in the scene.
* **`addLight(light)`**: Adds an `AllDirLight` or `SpotLight` to the scene.
* **`setRealismLevel(level)`**: Switches shader quality (`0` = flat unlit, `1` = directional lighting, `2` = lighting + shadows).
* **`render()`**: Clears the WebGL buffer and draws all visible `gl.TRIANGLES` meshes using a 4×4 perspective projection matrix.

---

## 🚀 Quick Start Example
```javascript
import {
  MeshObject,
  Material,
  initializeScene
} from "https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v1/Three-dim.js";

const scene = initializeScene("vortexCanvas");
const sphere = new MeshObject("sphere", new Material("Metallic", { r: 163, g: 230, b: 53 }));
scene.addObject(sphere);

function animate() {
  sphere.rotation.y += 1;
  scene.render();
  requestAnimationFrame(animate);
}
animate();
```

---

## 📄 Open-Source License
Open-source software licensed under the **MIT License** by **GrapeGreen, Inc.** Free to use, modify, and distribute in personal and commercial projects.
