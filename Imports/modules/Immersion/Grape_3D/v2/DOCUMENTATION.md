# Grape_3D v2 API Documentation
## 1. Overview & Quick Start
$$Grape_3D v2$$ is a dependency-free, WebGL1-based 3D rendering engine written in modern ES6 JavaScript. It supports image and procedural textures, area-weighted smooth vertex normals, Blinn-Phong specular lighting, collision detection, raycasting, and built-in camera controls.
## Basic Setup
Create a $$<canvas>$$ element in your HTML and import the module:

<canvas id="grape-canvas" width="800" height="600"></canvas>

<script type="module">
  import {
    initializeScene,
    MeshObject,
    Material,
    Texture,
    Vector3
  } from './Three-dim.js';

  // 1. Initialize scene with default lighting
  const scene = initializeScene('grape-canvas');
  scene.enableOrbitControls();

  // 2. Create a procedural texture and material
  const gridTex = Texture.createProcedural('grid', 256, { repeat: [2, 2] });
  const mat = new Material('Standard', { r: 255, g: 255, b: 255 }, 0.3, 0.5, gridTex);

  // 3. Add a smooth-shaded sphere
  const sphere = new MeshObject('sphere', mat);
  sphere.position = new Vector3(0, 0, 0);
  scene.addObject(sphere);

  // 4. Render loop
  function animate() {
    sphere.rotation.y += 0.5;
    scene.render();
    requestAnimationFrame(animate);
  }
  animate();
</script>

## 2. Core Math & Camera## $$Vector2$$ & $$Vector3$$ 
2D and 3D vector math utilities.

| Class | Constructor | Methods |
| $$Vector2$$ | $$new Vector2(x = 0, y = 0)$$ | $$add(v)$$ , $$sub(v)$$ , $$mult(n)$$ |
| $$Vector3$$ | $$new Vector3(x = 0, y = 0, z = 0)$$ | $$add(v)$$ , $$sub(v)$$ , $$mult(n)$$ , $$dot(v)$$ , $$cross(v)$$ , $$magnitude()$$ , $$normalize()$$ , $$lerp(v, t)$$ |

## $$Camera$$ 
Controls perspective projection and viewpoint transformation.

* Constructor: $$new Camera(position = new Vector3(0, 0, -5), yaw = 0, pitch = 0, fov = 60, near = 0.1, far = 1000.0)$$ 
* Properties: $$position$$ ($$Vector3$$ ), $$yaw$$ (degrees), $$pitch$$ (degrees), $$fov$$ , $$near$$ , $$far$$ 
* Methods:
* $$lookAt(target: Vector3)$$ : Automatically adjusts $$yaw$$ and $$pitch$$ to face the specified 3D point.
   
## 3. Textures & Materials## $$Texture$$ 
Handles external images, HTML $$<canvas>$$ elements, and built-in procedural textures with automatic WebGL1 power-of-two mipmapping and non-power-of-two fallback.

* Constructor: $$new Texture(source = null, options = {})$$ 
* $$source$$ : URL string, $$HTMLImageElement$$ , or $$HTMLCanvasElement$$ .
   * $$options$$ :
   * $$repeat$$ : $$[x, y]$$ UV tiling multiplier (default $$[1, 1]$$ ).
      * $$offset$$ : $$[x, y]$$ UV scroll offset (default $$[0, 0]$$ ).
      * $$flipY$$ : $$boolean$$ vertically flips image on upload (default $$true$$ ).
      * $$pixelArt$$ : $$boolean$$ uses $$NEAREST$$ filtering instead of $$LINEAR$$ (default $$false$$ ).
      * Static Methods:
* $$Texture.createProcedural(preset, size = 256, options = {})$$ : Generates a ready-to-use $$Texture$$ .
   * Presets: $$"checker"$$ , $$"grid"$$ , $$"noise"$$ , $$"grape"$$ .
      * Options: Accepts standard texture options plus preset colors ($$colorA$$ , $$colorB$$ for checker; $$bg$$ , $$fg$$ for grid).
      
## $$Material$$ 
Defines surface shading, specular highlights, and texture bindings.

* Constructor: $$new Material(type = "Standard", color = { r: 163, g: 230, b: 53 }, roughness = 0.4, reflectivity = 0.35, texture = null)$$ 
* Material Types ($$type$$ ):
* $$"Standard"$$ : Lit surface with Blinn-Phong specular highlights.
   * $$"Glass"$$ : Semi-transparent surface with Fresnel edge glow.
   * $$"Metallic"$$ : Tinted specular reflections matching the material color.
   * $$"Hologram"$$ : Animated vertical scanlines with cyan rim lighting.
   * Properties:
* $$roughness$$ : $$0.0$$ (mirror-sharp specular) to $$1.0$$ (broad matte highlight).
   * $$reflectivity$$ : Specular highlight intensity multiplier.
   * $$emissiveColor$$ : $${ r, g, b }$$ self-illumination color.
   * $$emissiveStrength$$ : $$number$$ intensity of emissive glow (default $$0.0$$ ).
   * Methods:
* $$setTexture(textureOrUrl, options = {})$$ : Attaches an existing $$Texture$$ or loads one from a URL string.
   
## 4. Meshes & Smooth Normals## $$MeshObject$$ 
Represents a 3D renderable and collidable object in the scene.

* Constructor: $$new MeshObject(type = "box", material = new Material(), options = {})$$ 
* Built-in Primitives ($$type$$ ):
* $$"box"$$ : Unit cube with per-face UVs.
   * $$"plane"$$ : Flat ground/wall quad on the XZ plane.
   * $$"pyramid"$$ : 4-sided pyramid.
   * $$"sphere"$$ : UV-mapped sphere (24 segments).
   * $$"cylinder"$$ : Capped cylinder (32 segments).
   * $$"torus"$$ : 3D ring/donut (32 major × 18 minor segments).
   * Transform Properties:
* $$position$$ : $$Vector3$$ (default $$(0, 0, 0)$$ )
   * $$rotation$$ : $$Vector3$$ in Euler degrees (default $$(0, 0, 0)$$ )
   * $$scale$$ : $$Vector3$$ (default $$(1, 1, 1)$$ )
   * $$receiveShadows$$ : $$boolean$$ (default $$true$$ )
   * $$collider$$ : Auto-configured $$ColliderBody$$ matching the primitive type.
   
## Smooth Normals
$$Grape_3D v2$$ computes area-weighted smooth vertex normals by welding coincident spatial vertices while leaving flat primitives sharp by default.

* Default Behavior: $$smoothNormals$$ defaults to $$true$$ for $$"sphere"$$ , $$"cylinder"$$ , and $$"torus"$$ , and $$false$$ for $$"box"$$ , $$"plane"$$ , and $$"pyramid"$$ .
* Constructor Override: $$new MeshObject("box", mat, { smoothNormals: true })$$ 
* Runtime Toggle:

  mesh.setSmoothNormals(true); // Recomputes and updates GPU normal buffer immediately

## Custom Geometry
You can supply custom triangle vertex arrays ($$[x1, y1, z1, x2, y2, z2, ...]$$ ) and optional UV arrays ($$[u1, v1, u2, v2, ...]$$ ):

const custom = new MeshObject("custom", mat, { smoothNormals: true });
custom.customPoints = [ /* flat array of triangle vertices */ ];
custom.customUVs = [ /* optional flat array of UVs; auto-generated if omitted */ ];
scene.addObject(custom);

## 5. Lighting, Scene & Controls## Light Classes

| Class | Constructor | Description |
| $$AllDirLight$$ | $$new AllDirLight(direction, color, intensity)$$ | Global directional sunlight with Blinn-Phong specular. |
| $$SpotLight$$ | $$new SpotLight(position, direction, angle, color, intensity)$$ | Cone spotlight with soft edge falloff and shadow casting. |
| $$PointLight$$ | $$new PointLight(position, color, intensity, range)$$ | Omnidirectional local light with quadratic range attenuation. |

## $$GrapeScene3D$$ 
The main WebGL renderer and scene manager.

* Constructor: $$new GrapeScene3D(canvasId)$$ 
* Properties:
* $$camera$$ : Active $$Camera$$ instance.
   * $$objects$$ : Array of active $$MeshObject$$ instances.
   * $$lights$$ : Array of active lights.
   * $$realismLevel$$ : $$0$$ (unlit flat), $$1$$ (lit), $$2$$ (lit + shadows, default).
   * $$enableFog$$ : $$boolean$$ enables exponential squared distance fog (default $$false$$ ).
   * $$fogColor$$ : $${ r, g, b }$$ fog color (matches background color when $$setBackgroundColor$$ is used).
   * $$fogDensity$$ : $$number$$ fog thickness (default $$0.015$$ ).
   * Methods:
* $$addObject(obj)$$ / $$removeObject(obj)$$ : Adds or removes a $$MeshObject$$ and manages its WebGL buffers.
   * $$addLight(light)$$ : Registers a light source.
   * $$setBackgroundColor(r, g, b, a = 1.0)$$ : Sets clear color ($$0–255$$ RGB) and syncs $$fogColor$$ .
   * $$setRealismLevel(level)$$ : Updates rendering quality ($$0$$ , $$1$$ , or $$2$$ ).
   * $$enableOrbitControls(options = {})$$ : Enables mouse-drag look and $$WASD$$ / Arrow / $$Q$$ / $$E$$ movement ($${ moveSpeed: 0.15, lookSensitivity: 0.35 }$$ ).
   * $$checkCollisions()$$ : Returns an array of $${ a, b }$$ pairs for all intersecting $$MeshObject$$ colliders.
   * $$render()$$ : Advances internal clock, updates controls, and draws the scene.
   
## $$Raycaster$$ & $$ColliderBody$$ 

* $$Raycaster$$ :
* $$raycaster.setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera)$$ 
   * $$raycaster.intersectObject(obj)$$ → Returns $${ hit: boolean, distance?: number, point?: Vector3 }$$ using bounding-sphere broadphase and Möller–Trumbore triangle intersection.
   * $$ColliderBody$$ :
* $$colliderA.intersects(colliderB, posA, posB)$$ → Supports Sphere, Box (AABB), Cylinder, and Triangle-Triangle SAT narrowphase intersection tests.
   
## Helper Function

* $$initializeScene(canvasId)$$ : Creates a $$GrapeScene3D$$ instance positioned at $$(0, 1, -6)$$ pre-configured with one $$AllDirLight$$ , one $$SpotLight$$ , and one $$PointLight$$ .


