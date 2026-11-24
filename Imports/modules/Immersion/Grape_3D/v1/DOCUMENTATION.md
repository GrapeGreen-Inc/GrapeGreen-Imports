# 🍇 GrapeGreen Imports Core
### Module Core: `Three-dim.js` (V1 Production Release)

Free, open-source WebGL GPU-accelerated 3D graphics engine licensed under **MPL-2.0**. Import it directly into any web project—no build tools, API keys, or installation required.

* **Public CDN / Import Link:** `https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v1/Three-dim.js`

---

## ⚡ Quick Start (Copy & Paste Into Any HTML File)
Anyone can use `Three-dim.js` directly in the browser using a standard `<script type="module">` tag:

```html
<canvas id="sceneCanvas" width="800" height="600"></canvas>

<script type="module">
  import {
    MeshObject,
    Material,
    initializeScene
  } from "https://github.io";

  const scene = initializeScene("sceneCanvas");
  const sphere = new MeshObject("sphere", new Material("Metallic", { r: 163, g: 230, b: 53 }));
  scene.addObject(sphere);

  function animate() {
    sphere.rotation.y += 1;
    scene.render();
    requestAnimationFrame(animate);
  }
  animate();
</script>
```

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
} from "https://github.io";
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
* **Transform fields**: `position` (`Vector3`), `rotation` (`Vector3` in degrees supporting **X Pitch**, **Y Yaw**, and **Z Roll**), `scale` (`Vector3`).
* **`customPoints`** (`Array`): Flat array of triangle vertex coordinates (`[x1, y1, z1, x2, y2, z2, ...]`).
* **`computeNormals()`**: Automatically generates per-triangle surface normals for dynamic lighting.
* **`initBuffers(gl)`**: Pre-allocates and caches WebGL vertex and normal buffers on initialization so `render()` runs with zero buffer allocations.
* **`boundingRadius`** (`Number`): Culling and broad-phase radius used for camera frustum and raycast checks.
* **`receiveShadows`** (`Boolean`): Toggles real-time spotlight shadow checks on the mesh (defaults to `true`).

---

## 💎 4. Graphics Material Shaders (`Material`)
```javascript
const material = new Material(type, color, roughness, reflectivity);
```
* **`Standard`**: Base directional and spotlight-lit shading matrix.
* **`Glass`**: Activates alpha-blended fragment translucency calculations.
* **`Metallic`**: Amplifies specular highlight brightness.
* **`color`** (`Object`): RGB object `{ r, g, b }` (defaults to `{ r: 163, g: 230, b: 53 }`).
* **`roughness` / `reflectivity`** (`Number`): Surface material properties (defaults to `0.5` and `0.1`).

---

## 💥 5. Universal Physics & Bounding Colliders (`ColliderBody`)
```javascript
const collider = new ColliderBody(type, radius, size, height, meshRef);
```
* **Universal All-Shape Detection**: Automatically supports collisions across every combination of **`Box`**, **`Sphere`**, **`Cylinder`**, **`Pyramid`**, and **custom triangle meshes** (using exact analytic bounds plus 3D Separating Axis Theorem triangle-vs-triangle checks).
* **`intersects(other, posA, posB)`**: Returns `true` if two colliders intersect, automatically accounting for object `scale`.
* **`scene.checkCollisions()`**: Scans all objects in the scene and returns an array of colliding pairs (`[{ a, b }, ...]`).

---

## 💡 6. Dynamic Lighting Environments (`AllDirLight` / `SpotLight`)
* **`AllDirLight(direction, color, intensity)`**: Global directional light whose direction, RGB color, and intensity directly shade every triangle face in the fragment shader.
* **`SpotLight(position, direction, angle, color, intensity)`**: Conical target light beam with cutoff angle, RGB color, intensity, and real-time shadow casting.

---

## 🎯 7. Exact Ray-vs-Triangle Raycasting (`Raycaster`)
```javascript
const raycaster = new Raycaster();
raycaster.setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera);
let hitResult = raycaster.intersectObject(meshObject);
```
* **Camera-Aware Rays**: Accounts for camera `position`, `yaw`, `pitch`, `fov`, and canvas aspect ratio.
* **Exact Mesh Intersection**: Tests against the object's actual scaled and rotated triangles (`Möller–Trumbore` algorithm) and returns `{ hit: true, distance, point }` (or `{ hit: false }`).

---

## 🎬 8. Scene Renderer (`GrapeScene3D` & `initializeScene`)
```javascript
const scene = initializeScene("canvasId");
```
* **`initializeScene(canvasId)`**: Creates a `GrapeScene3D` instance, moves the camera to `(0, 0, -6)`, and adds default directional and spot lights.
* **`addObject(obj)`**: Registers a `MeshObject` in the scene and pre-builds its WebGL GPU buffers once.
* **`removeObject(obj)`**: Removes a `MeshObject` from the scene and frees its WebGL GPU buffers.
* **`addLight(light)`**: Adds an `AllDirLight` or `SpotLight` to the scene.
* **`checkCollisions()`**: Returns all currently colliding `{ a, b }` object pairs in the scene.
* **`setRealismLevel(level)`**: Switches shader quality (`0` = flat unlit, `1` = dynamic directional + spotlight shading, `2` = full lighting + shadows).
* **`render()`**: Renders all visible `gl.TRIANGLES` meshes using cached GPU buffers and a 4×4 perspective projection matrix.

---

## 🌍 Open Usage & License
This library is **free and open to use** in any personal, educational, or commercial project under the **Mozilla Public License 2.0 (`MPL-2.0`)** by **GrapeGreen, Inc.** You may import and combine it in proprietary or open-source projects—any modifications made directly to `Three-dim.js` remain under `MPL-2.0`.
