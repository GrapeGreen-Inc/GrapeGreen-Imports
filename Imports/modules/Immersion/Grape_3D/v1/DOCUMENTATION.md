# 🍇 GrapeGreen Imports Core
### Module Core: `Three-dim.js` (V1 Production Release)

Modular WebGL GPU-accelerated graphics engine running completely on client-side vector mechanics and hardware shaders.

---

## 🌐 1. Vector Math Core (`Vector3`)
```javascript
import { Vector3 } from "https://github.io";
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
const camera = new Camera(position, yaw, pitch, fov);
```
* **`position`** (`Vector3`): View location vector.
* **`yaw`** (`Number`): Left-to-right rotation angle.
* **`pitch`** (`Number`): Up-and-down tilt angle.
* **`fov`** (`Number`): Field of view boundaries.

---

## 🧱 3. Geometric Object Shape Primitives (`MeshObject`)
```javascript
const shape = new MeshObject(type, material);
```
* **Supported primitives**: `box`, `pyramid`, `sphere`, `cylinder`.
* **Transform fields**: `position`, `rotation` (where `rotation.y` is **Yaw**), `scale`.
* **`customPoints`** (`Array`): Modifiable array containing raw vertex layout coordinate sets.

---

## 💎 4. Graphics Material Shaders (`Material`)
```javascript
const material = new Material(type, color, roughness, reflectivity);
```
* **`Standard`**: Base shading matrix.
* **`Glass`**: Activates fragment translucency calculations.
* **`Metallic`**: Amplifies specular highlight filters.

---

## 💥 5. Physics & Bounding Colliders (`ColliderBody`)
* **`intersects(other, posA, posB)`**: Returns boolean matrix collision status.

---

## 💡 6. Lighting Environments (`AllDirLight` / `SpotLight`)
* **`AllDirLight(direction, color, intensity)`**: Ambient global sky rendering light.
* **`SpotLight(position, direction, angle, color, intensity)`**: Conical target light beam vectors.

---

## 🎯 7. Interactive Raycasting (`Raycaster`)
```javascript
const raycaster = new Raycaster();
raycaster.setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera);
let hitResult = raycaster.intersectObject(meshObject);
```

---

*Property of GrapeGreen, Inc. Proprietary closed-source component library documentation.*
