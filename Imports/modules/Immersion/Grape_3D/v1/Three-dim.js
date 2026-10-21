// 🍇 GrapeGreen-Imports: Core 3D Graphics Engine & Component Architecture Module
// Location: /modules/Immersion/Grape_3D/v1/Three-dim.js

// --- 🌐 CORE MATHEMATICAL VECTOR 3 ENGINE ---
export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x; this.y = y; this.z = z;
    }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    mult(n) { return new Vector3(this.x * n, this.y * n, this.z * n); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
    magnitude() { return Math.sqrt(this.dot(this)); }
    normalize() { let m = this.magnitude(); return m > 0 ? this.mult(1 / m) : new Vector3(); }
}

// --- 💡 LIGHTING ENTITIES ---
export class AllDirLight { // Ambient / Directional Global Sky Light
    constructor(direction = new Vector3(0, -1, 0), color = { r: 255, g: 255, b: 255 }, intensity = 0.5) {
        this.direction = direction.normalize();
        this.color = color;
        this.intensity = intensity;
    }
}

export class SpotLight { // Conical Positional Target Light
    constructor(position = new Vector3(), direction = new Vector3(0, -1, 0), angle = 30, color = { r: 163, g: 230, b: 53 }, intensity = 1.0) {
        this.position = position;
        this.direction = direction.normalize();
        this.cutoff = Math.cos(angle * Math.PI / 180);
        this.color = color;
        this.intensity = intensity;
    }
}

// --- 🎥 CAMERA VIEWPORT PLATFORM ---
export class Camera {
    constructor(position = new Vector3(0, 0, -300), yaw = 0, pitch = 0, fov = 60) {
        this.position = position;
        this.yaw = yaw; // Rotation around vertical axis
        this.pitch = pitch;
        this.fov = fov;
        this.fovScale = Math.tan((fov * Math.PI / 180) / 2);
    }
}

// --- 💎 GRAPHICS MATERIAL PIPELINES ---
export class Material {
    constructor(type = "Standard", color = { r: 203, g: 195, b: 227 }, roughness = 0.5, reflectivity = 0.1) {
        this.type = type; // "Standard", "Glass", "Metallic", "Reflective"
        this.color = color;
        this.roughness = roughness;
        this.reflectivity = reflectivity;
    }
}

// --- 💥 PHYSICS & BOUNDING COLLIDERS ---
export class ColliderBody {
    constructor(type = "Box", radius = 0, size = new Vector3()) {
        this.type = type; // "Sphere" or "Box" bounding volumes
        this.radius = radius;
        this.size = size;
    }
    intersects(other, posA, posB) {
        if (this.type === "Sphere" && other.type === "Sphere") {
            let dist = posA.sub(posB).magnitude();
            return dist <= (this.radius + other.radius);
        }
        // Basic fail-open safety for custom matrix loops
        return false;
    }
}

// --- 🧱 GEOMETRIC OBJECT SHAPE PRIMITIVES ---
export class MeshObject {
    constructor(type = "box", material = new Material()) {
        this.type = type; // "sphere", "cylinder", "box", "pyramid"
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Vector3(0, 0, 0); // X, Y, Z (Yaw)
        this.scale = new Vector3(1, 1, 1);
        this.material = material;
        this.collider = new ColliderBody(type === "sphere" ? "Sphere" : "Box", 50, new Vector3(100, 100, 100));
        
        // Raw editable structural coordinates for custom vertex transformations
        this.customPoints = []; 
        this.initGeometry();
    }

    initGeometry() {
        if (this.type === "box") {
            this.customPoints = [
                new Vector3(-50, -50, -50), new Vector3(50, -50, -50),
                new Vector3(50, 50, -50),  new Vector3(-50, 50, -50),
                new Vector3(-50, -50, 50),  new Vector3(50, -50, 50),
                new Vector3(50, 50, 50),   new Vector3(-50, 50, 50)
            ];
        } else if (this.type === "pyramid") {
            this.customPoints = [
                new Vector3(-50, 50, -50),  new Vector3(50, 50, -50),
                new Vector3(50, 50, 50),   new Vector3(-50, 50, 50),
                new Vector3(0, -50, 0)      // Peak vertex element
            ];
        } else if (this.type === "sphere") {
            this.radius = 50;
        } else if (this.type === "cylinder") {
            this.radius = 40;
            this.height = 100;
        }
    }
}

// --- 🎯 INTERACTIVE RAYCASTER INTERCEPTOR ---
export class Raycaster {
    constructor() {
        this.origin = new Vector3();
        this.direction = new Vector3();
    }
    setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera) {
        // Convert screen coordinates down to standard normalized device dimensions (-1 to 1)
        let nx = (screenX / canvasWidth) * 2 - 1;
        let ny = -(screenY / canvasHeight) * 2 + 1;
        
        // Project ray line vector pointing straight from the camera view matrix
        this.origin = camera.position;
        let rayDir = new Vector3(nx * camera.fovScale * (canvasWidth / canvasHeight), ny * camera.fovScale, 1);
        
        // Quick mathematical conversion mapping local Yaw camera adjustments
        let radYaw = camera.yaw * Math.PI / 180;
        let rx = rayDir.x * Math.cos(radYaw) - rayDir.z * Math.sin(radYaw);
        let rz = rayDir.x * Math.sin(radYaw) + rayDir.z * Math.cos(radYaw);
        
        this.direction = new Vector3(rx, rayDir.y, rz).normalize();
    }
    intersectObject(obj) {
        // High-speed ray intersection bounding algorithms
        let oc = this.origin.sub(obj.position);
        if (obj.type === "sphere") {
            let b = oc.dot(this.direction);
            let c = oc.dot(oc) - (obj.radius * obj.radius);
            let h = b * b - c;
            return h >= 0 ? { hit: true, distance: -b - Math.sqrt(h) } : { hit: false };
        }
        // Fail-open click bounding array box placeholder
        let dist = oc.magnitude();
        return dist < 120 ? { hit: true, distance: dist } : { hit: false };
    }
}

// --- 🎮 MASTER 3D SCENE ENVIRONMENT CONTEXT ---
export class GrapeScene3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.objects = [];
        this.lights = [];
        this.camera = new Camera();
        this.raycaster = new Raycaster();
    }

    addObject(obj) { this.objects.push(obj); }
    addLight(light) { this.lights.push(light); }

    render() {
        let width = this.canvas.width;
        let height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);

        // Fetch direct raw image coordinate buffer to render pixels calculations pixel-by-pixel
        let imgData = this.ctx.createImageData(width, height);
        let data = imgData.data;

        // Loop execution through each pixel row on screen to trace lighting and reflections
        for (let y = 0; y < height; y += 4) { // Ticked steps optimize execution rendering frames smoothly
            for (let x = 0; x < width; x += 4) {
                // Initialize clean default GrapeGreen background gradient palettes (Dark Purple)
                let r = 44, g = 26, b = 77; 

                this.raycaster.setFromCamera(x, y, width, height, this.camera);

                this.objects.forEach(obj => {
                    let intersect = this.raycaster.intersectObject(obj);
                    if (intersect.hit) {
                        let baseColor = obj.material.color;
                        
                        // Default ambient parameters
                        let illumination = 0.3;

                        // Process running lights loops
                        this.lights.forEach(light => {
                            if (light instanceof AllDirLight) {
                                illumination += light.intensity;
                            }
                        });

                        // Map custom material matrix shaders
                        if (obj.material.type === "Glass") {
                            r = Math.min(255, baseColor.r * illumination * 0.4 + 100);
                            g = Math.min(255, baseColor.g * illumination * 0.4 + 100);
                            b = Math.min(255, baseColor.b * illumination * 0.6 + 150); // Boosted blue channel tint
                        } else if (obj.material.type === "Metallic") {
                            let specular = 1.8; // High reflection highlight
                            r = Math.min(255, baseColor.r * illumination * specular);
                            g = Math.min(255, baseColor.g * illumination * specular);
                            b = Math.min(255, baseColor.b * illumination * specular);
                        } else { // Standard Shading
                            r = Math.min(255, baseColor.r * illumination);
                            g = Math.min(255, baseColor.g * illumination);
                            b = Math.min(255, baseColor.b * illumination);
                        }
                    }
                });

                // Blast calculated pixel arrays out onto the local viewport grid blocks
                for (let dx = 0; dx < 4; dx++) {
                    for (let dy = 0; dy < 4; dy++) {
                        let idx = ((x + dx) + (y + dy) * width) * 4;
                        if (idx < data.length) {
                            data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
                        }
                    }
                }
            }
        }
        this.ctx.putImageData(imgData, 0, 0);
    }
}
