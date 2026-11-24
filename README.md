# 🍇 GrapeGreen Imports

Official CDN and open-source ES6 module repository for **GrapeGreen, Inc.** Import lightweight, dependency-free web modules directly into your browser—no build tools, bundlers, or API keys required.

Licensed under the **Mozilla Public License 2.0 (`MPL-2.0`)**.

---

## 📦 Available Modules

### Immersion — `Grape_3D`
A dependency-free, WebGL-powered 3D rendering engine written in modern ES6 JavaScript.

| Version | Status | Module CDN URL (Case-Sensitive) | Documentation | Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **v2.0** | **Latest (Recommended)** | `https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v2/Three-Dim.js` | [v2 Docs](https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v2/DOCUMENTATION.md) | Image & procedural textures, smooth vertex normals, Blinn-Phong speculars, distance fog, point lights, orbit controls, `torus` & `plane` primitives |
| **v1.0** | **Legacy / Stable** | `https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v1/Three-dim.js` | [v1 Docs](https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v1/DOCUMENTATION.md) | Core WebGL renderer, directional & spot lights, raycasting, SAT & primitive collision detection |

> **⚠️ Note on Case-Sensitivity:** GitHub Pages URLs are strictly case-sensitive. **v2** uses `Three-Dim.js` (capital `D`) while **v1** uses `Three-dim.js` (lowercase `d`).

---

## ⚡ Quick Start (`Grape_3D v2`)

Drop a `<canvas>` into any HTML file and import `Three-Dim.js` using `<script type="module">`:

```html
<canvas id="grape-canvas" width="800" height="600"></canvas>

<script type="module">
  import {
    initializeScene,
    MeshObject,
    Material,
    Texture,
    Vector3
  } from "https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v2/Three-Dim.js";

  const scene = initializeScene("grape-canvas");
  scene.enableOrbitControls();

  const tex = Texture.createProcedural("grid", 256, { repeat: [2, 2] });
  const mat = new Material("Standard", { r: 163, g: 230, b: 53 }, 0.3, 0.5, tex);

  const sphere = new MeshObject("sphere", mat);
  sphere.position = new Vector3(0, 0, 0);
  scene.addObject(sphere);

  function animate() {
    sphere.rotation.y += 0.5;
    scene.render();
    requestAnimationFrame(animate);
  }
  animate();
</script>
```

---

## 🛡️ Versioning Policy
Older major versions (such as `v1`) remain untouched at their original URLs so existing projects never break when new versions (`v2+`) are released.

---

## 📄 License
Free to use in personal, educational, and commercial projects under **MPL-2.0** by **GrapeGreen, Inc.** Any modifications made directly to the core module files must remain open under `MPL-2.0`.
