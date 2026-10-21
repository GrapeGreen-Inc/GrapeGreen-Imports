# 🍇 GrapeGreen Imports Core
### Module Core: `Three-dim.js` (V1 Production Release)

Welcome to the official developer documentation for the scratch-built, modular **GrapeGreen 3D Engine**. This library operates entirely on client-side vector mechanics, high-performance matrix transformations, and raytracing shaders without any heavy third-party runtime frameworks.

---

## 🌐 1. Vector Math Core (`Vector3`)
The bedrock vector math module handling all 3D workspace point positions, directions, and object transformations.

```javascript
import { Vector3 } from "https://github.io";
```

### Methods Matrix
* **`add(v)`**: Combines coordinates with another `Vector3`.
* **`sub(v)`**: Subtracts coordinates from another `Vector3` to find distances or directions.
* **`mult(n)`**: Scales structural vectors by a constant multiplier numeric value.
* **`dot(v)`**: Computes the dot product (vital for light angles and surface ray shading).
* **`cross(v)`**: Calculates the cross product to instantly find perpendicular surface normals.
* **`magnitude()`**: Returns the precise mathematical length of a vector string.
* **`normalize()`**: Scales the vector line down to a unit length of 1 while keeping its direction.

---

## 🎥 2. Camera Platform System (`Camera`)
Manages the user's viewport perspective coordinates, tracking view matrix rotation angles, field of view, and horizontal alignment steps.

### Initialization Properties
```javascript
const camera = new Camera(position, yaw, pitch, fov);
```
* **`position`** (`Vector3`): The camera location in space (Default: `(0, 0, -300)`).
* **`yaw`** (`Number`): The left-to-right panning angle in degrees (0 to 360).
* **`pitch`** (`Number`): The up-and-down tilt angle in degrees.
* **`fov`** (`Number`): Field of view perspective angle layout bounds (Default: `60`).

---

## 🧱 3. Geometric Object Shape Primitives (`MeshObject`)
Instantiates baseline 3D geometric entities packed with automated colliders, structural points arrays, and customizable transform nodes.

### Configuration Properties
```javascript
const shape = new MeshObject(type, material);
```

### Supported Primitives (`type`)
* **`box`**: Standard 8-vertex cubic block.
* **`pyramid`**: 5-vertex directional geometric cone layout with an adjustable height apex point.
* **`sphere`**: Parametric surface shape governed by a radius property (Default: `50`).
* **`cylinder`**: Two-tiered rounded column defined by radius and custom height arrays.

### Editable Fields
* **`position`** (`Vector3`): Dynamic coordinate values mapping placement on the scene grid.
* **`rotation`** (`Vector3`): Independent axes rotation tracking where `rotation.y` acts as the object's **Yaw**.
* **`scale`** (`Vector3`): Dimensions modifier multiplier arrays.
* **`customPoints`** (`Array`): Direct access array holding raw mathematical coordinates for precise individual vertex bending/sculpting!

---

## 💎 4. Graphics Material Shaders (`Material`)
Defines how light waves react with object surfaces, providing unique surface identities and rendering looks.

### Shading Models (`type`)
* **`Standard`**: Classic non-metal layout applying soft lavender profiles (`#cbc3e3`) with normal lighting gradients.
* **`Glass`**: Multiplies transmission vectors, adding deep blue/cyan light blending properties to emulate glass panels.
* **`Metallic`**: Boosts secular calculations, casting clean, high-intensity color profiles to emulate polished chrome.
* **`Reflective`**: Evaluates angle paths to calculate mirror tracing steps on targeted canvas blocks.

---

## 💥 5. Physics & Bounding Colliders (`ColliderBody`)
Handles structural spatial boundaries to determine cross-object intersections and contact maps.

* **`type`**: Matches target primitive parameters (`Sphere` or `Box`).
* **`intersects(other, posA, posB)`**: Automatically flags boolean `true`/`false` metrics if two bounding volumes crunch together on the coordinate field.

---

## 💡 6. Lighting Environments (`AllDirLight` / `SpotLight`)
Controls brightness levels, shading intensities, and shadow calculations on active entities.

* **`AllDirLight(direction, color, intensity)`**: Simulates an ambient planetary sky light casting global illumination rays down evenly across the scene structure.
* **`SpotLight(position, direction, angle, color, intensity)`**: Injects a specialized conical light beam pointing from a custom space vector down toward a target object (Default: **GrapeGreen Lime Green** `#a3e635`).

---

## 🎯 7. Interactive Raycasting (`Raycaster`)
Fires a silent mathematical pointer from the screen coordinates straight through the 3D space to detect user clicks on objects.

### Operational Sequence
```javascript
const raycaster = new Raycaster();
// 1. Map mouse click position relative to camera angles
raycaster.setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera);

// 2. Query target shape to find contact status
let hitResult = raycaster.intersectObject(meshObject);
if (hitResult.hit) {
    console.log("Object clicked! Intersection distance:", hitResult.distance);
}
```

---

*Property of GrapeGreen, Inc. Proprietary closed-source component library documentation.*
