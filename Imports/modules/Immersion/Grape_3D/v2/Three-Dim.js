// Module URL: https://grapegreen-inc.github.io/GrapeGreen-Imports/Imports/modules/Immersion/Grape_3D/v2/Three-dim.js
// Grape_3D v2.0 - WebGL Rendering Engine with Textures, Smooth Normals, Specular Lighting & Procedural Assets

export class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vector2(this.x * n, this.y * n); }
}

export class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
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
    lerp(v, t) {
        return new Vector3(
            this.x + (v.x - this.x) * t,
            this.y + (v.y - this.y) * t,
            this.z + (v.z - this.z) * t
        );
    }
}

export class Texture {
    /**
     * Supports URL strings, HTMLImageElement, HTMLCanvasElement, or procedural presets.
     * @param {string|HTMLImageElement|HTMLCanvasElement|null} source
     * @param {object} options - { repeat: [1, 1], offset: [0, 0], flipY: true, pixelArt: false }
     */
    constructor(source = null, options = {}) {
        this.source = source;
        this.repeat = options.repeat || [1, 1];
        this.offset = options.offset || [0, 0];
        this.flipY = options.flipY !== undefined ? options.flipY : true;
        this.pixelArt = options.pixelArt || false;
        this._glTexture = null;
        this.isLoaded = false;
        this._image = null;

        if (typeof source === "string") {
            this.loadFromURL(source);
        } else if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
            this._image = source;
            this.isLoaded = true;
        }
    }

    loadFromURL(url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            this._image = img;
            this.isLoaded = true;
            this._needsUpload = true;
        };
        img.onerror = () => {
            console.warn(`Grape_3D: Failed to load texture at '${url}', falling back to checkerboard.`);
            this._image = Texture.createProceduralCanvas("checker");
            this.isLoaded = true;
            this._needsUpload = true;
        };
        img.src = url;
    }

    bind(gl, unit = 0) {
        if (!gl) return false;
        gl.activeTexture(gl.TEXTURE0 + unit);

        if (!this._glTexture) {
            this._glTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this._glTexture);
            // Temporary 1x1 white pixel until image finishes decoding
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255])
            );
            this._needsUpload = this.isLoaded;
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this._glTexture);
        }

        if (this.isLoaded && this._needsUpload && this._image) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);

            const isPOT = (v) => (v & (v - 1)) === 0;
            const w = this._image.width || 1;
            const h = this._image.height || 1;

            if (isPOT(w) && isPOT(h)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.pixelArt ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.pixelArt ? gl.NEAREST : gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            } else {
                // WebGL1 NPOT compatibility
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.pixelArt ? gl.NEAREST : gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.pixelArt ? gl.NEAREST : gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            this._needsUpload = false;
        }
        return true;
    }

    /**
     * Built-in Procedural Texture Generator ("checker", "grid", "noise", "grape")
     */
    static createProcedural(preset = "checker", size = 256, options = {}) {
        const canvas = Texture.createProceduralCanvas(preset, size, options);
        const tex = new Texture(canvas, options);
        tex._needsUpload = true;
        return tex;
    }

    static createProceduralCanvas(preset = "checker", size = 256, options = {}) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        if (preset === "grid") {
            ctx.fillStyle = options.bg || "#1e1633";
            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = options.fg || "#a3e635";
            ctx.lineWidth = Math.max(2, size / 64);
            const step = size / 8;
            for (let i = 0; i <= size; i += step) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
            }
        } else if (preset === "noise") {
            const imgData = ctx.createImageData(size, size);
            for (let i = 0; i < imgData.data.length; i += 4) {
                const v = 140 + Math.floor(Math.random() * 115);
                imgData.data[i] = v;
                imgData.data[i + 1] = v;
                imgData.data[i + 2] = v;
                imgData.data[i + 3] = 255;
            }
            ctx.putImageData(imgData, 0, 0);
        } else if (preset === "grape") {
            const grad = ctx.createRadialGradient(size * 0.35, size * 0.35, size * 0.05, size * 0.5, size * 0.5, size * 0.65);
            grad.addColorStop(0, "#d9f99d");
            grad.addColorStop(0.5, "#84cc16");
            grad.addColorStop(1, "#3f6212");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
        } else {
            // Default checkerboard
            const cells = 8;
            const cellSize = size / cells;
            for (let y = 0; y < cells; y++) {
                for (let x = 0; x < cells; x++) {
                    ctx.fillStyle = (x + y) % 2 === 0 ? (options.colorA || "#f8fafc") : (options.colorB || "#64748b");
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
        return canvas;
    }
}

export class AllDirLight {
    constructor(direction = new Vector3(0, -1, 0), color = { r: 255, g: 255, b: 255 }, intensity = 0.6) {
        this.direction = direction.normalize();
        this.color = color;
        this.intensity = intensity;
    }
}

export class SpotLight {
    constructor(position = new Vector3(), direction = new Vector3(0, -1, 0), angle = 30, color = { r: 163, g: 230, b: 53 }, intensity = 1.0) {
        this.position = position;
        this.direction = direction.normalize();
        this.cutoff = Math.cos(angle * Math.PI / 180);
        this.color = color;
        this.intensity = intensity;
    }
}

export class PointLight {
    constructor(position = new Vector3(0, 3, 0), color = { r: 192, g: 132, b: 252 }, intensity = 1.2, range = 25.0) {
        this.position = position;
        this.color = color;
        this.intensity = intensity;
        this.range = range;
    }
}

export class Camera {
    constructor(position = new Vector3(0, 0, -5), yaw = 0, pitch = 0, fov = 60, near = 0.1, far = 1000.0) {
        this.position = position;
        this.yaw = yaw;
        this.pitch = pitch;
        this.fov = fov;
        this.fovScale = Math.tan((fov * Math.PI / 180) / 2);
        this.near = near;
        this.far = far;
    }

    lookAt(target) {
        const dir = target.sub(this.position).normalize();
        this.yaw = Math.atan2(dir.x, dir.z) * 180 / Math.PI;
        this.pitch = -Math.asin(Math.max(-1, Math.min(1, dir.y))) * 180 / Math.PI;
    }
}

export class Material {
    /**
     * @param {string} type - "Standard", "Glass", "Metallic", "Emissive", "Hologram"
     * @param {object} color - { r, g, b }
     * @param {number} roughness - 0.0 (mirror sharp) to 1.0 (matte)
     * @param {number} reflectivity - Specular & rim highlight multiplier
     * @param {Texture|null} texture - Optional Texture instance
     */
    constructor(type = "Standard", color = { r: 163, g: 230, b: 53 }, roughness = 0.4, reflectivity = 0.35, texture = null) {
        this.type = type;
        this.color = color;
        this.roughness = roughness;
        this.reflectivity = reflectivity;
        this.texture = texture;
        this.emissiveColor = { r: 0, g: 0, b: 0 };
        this.emissiveStrength = 0.0;
    }

    setTexture(textureOrUrl, options = {}) {
        this.texture = textureOrUrl instanceof Texture ? textureOrUrl : new Texture(textureOrUrl, options);
        return this;
    }
}

export class ColliderBody {
    constructor(type = "Box", radius = 1.0, size = new Vector3(1, 1, 1), height = 2.0, meshRef = null) {
        this.type = type;
        this.radius = radius;
        this.size = size;
        this.height = height;
        this.meshRef = meshRef;
    }

    getWorldBounds(pos) {
        const s = this.meshRef ? this.meshRef.scale : new Vector3(1, 1, 1);
        const type = this.type.toLowerCase();
        if (type === "sphere") {
            const r = this.radius * Math.max(s.x, s.y, s.z);
            return { min: pos.sub(new Vector3(r, r, r)), max: pos.add(new Vector3(r, r, r)) };
        }
        if (type === "cylinder") {
            const r = this.radius * Math.max(s.x, s.z), hh = (this.height * s.y) * 0.5;
            return { min: pos.sub(new Vector3(r, hh, r)), max: pos.add(new Vector3(r, hh, r)) };
        }
        const half = new Vector3(this.size.x * s.x * 0.5, this.size.y * s.y * 0.5, this.size.z * s.z * 0.5);
        return { min: pos.sub(half), max: pos.add(half) };
    }

    static triTriOverlap(t1, t2) {
        const edges1 = [t1[1].sub(t1[0]), t1[2].sub(t1[1]), t1[0].sub(t1[2])];
        const edges2 = [t2[1].sub(t2[0]), t2[2].sub(t2[1]), t2[0].sub(t2[2])];
        const axes = [edges1[0].cross(edges1[1]), edges2[0].cross(edges2[1])];
        for (let e1 of edges1) for (let e2 of edges2) axes.push(e1.cross(e2));
        for (let axis of axes) {
            if (axis.magnitude() < 1e-6) continue;
            let min1 = Infinity, max1 = -Infinity, min2 = Infinity, max2 = -Infinity;
            for (let v of t1) { const p = v.dot(axis); if (p < min1) min1 = p; if (p > max1) max1 = p; }
            for (let v of t2) { const p = v.dot(axis); if (p < min2) min2 = p; if (p > max2) max2 = p; }
            if (max1 < min2 || max2 < min1) return false;
        }
        return true;
    }

    getWorldTriangles(pos) {
        if (!this.meshRef || !this.meshRef.customPoints?.length) return null;
        const pts = this.meshRef.customPoints, s = this.meshRef.scale, tris = [];
        for (let i = 0; i < pts.length; i += 9) {
            tris.push([
                new Vector3(pts[i] * s.x + pos.x, pts[i + 1] * s.y + pos.y, pts[i + 2] * s.z + pos.z),
                new Vector3(pts[i + 3] * s.x + pos.x, pts[i + 4] * s.y + pos.y, pts[i + 5] * s.z + pos.z),
                new Vector3(pts[i + 6] * s.x + pos.x, pts[i + 7] * s.y + pos.y, pts[i + 8] * s.z + pos.z)
            ]);
        }
        return tris;
    }

    intersects(other, posA = this.meshRef?.position, posB = other.meshRef?.position) {
        const bA = this.getWorldBounds(posA), bB = other.getWorldBounds(posB);
        if (bA.max.x < bB.min.x || bA.min.x > bB.max.x ||
            bA.max.y < bB.min.y || bA.min.y > bB.max.y ||
            bA.max.z < bB.min.z || bA.min.z > bB.max.z) return false;

        const tA = this.type.toLowerCase(), tB = other.type.toLowerCase();
        const sA = this.meshRef?.scale || new Vector3(1, 1, 1);
        const sB = other.meshRef?.scale || new Vector3(1, 1, 1);

        if (tA === "sphere" && tB === "sphere") {
            const rA = this.radius * Math.max(sA.x, sA.y, sA.z);
            const rB = other.radius * Math.max(sB.x, sB.y, sB.z);
            return posA.sub(posB).magnitude() <= (rA + rB);
        }

        if (tA === "box" && tB === "box") return true;

        if ((tA === "sphere" && tB === "box") || (tA === "box" && tB === "sphere")) {
            const sph = tA === "sphere" ? this : other, box = tA === "box" ? this : other;
            const sPos = tA === "sphere" ? posA : posB, bBounds = box.getWorldBounds(tA === "box" ? posA : posB);
            const sScale = tA === "sphere" ? sA : sB;
            const r = sph.radius * Math.max(sScale.x, sScale.y, sScale.z);
            const cx = Math.max(bBounds.min.x, Math.min(sPos.x, bBounds.max.x));
            const cy = Math.max(bBounds.min.y, Math.min(sPos.y, bBounds.max.y));
            const cz = Math.max(bBounds.min.z, Math.min(sPos.z, bBounds.max.z));
            return sPos.sub(new Vector3(cx, cy, cz)).magnitude() <= r;
        }

        if (tA === "cylinder" && tB === "cylinder") {
            const rA = this.radius * Math.max(sA.x, sA.z), rB = other.radius * Math.max(sB.x, sB.z);
            const dx = posA.x - posB.x, dz = posA.z - posB.z;
            return (dx * dx + dz * dz) <= (rA + rB) * (rA + rB);
        }

        if ((tA === "sphere" && tB === "cylinder") || (tA === "cylinder" && tB === "sphere")) {
            const sph = tA === "sphere" ? this : other, cyl = tA === "cylinder" ? this : other;
            const sPos = tA === "sphere" ? posA : posB, cPos = tA === "cylinder" ? posA : posB;
            const sScale = tA === "sphere" ? sA : sB, cScale = tA === "cylinder" ? sA : sB;
            const rS = sph.radius * Math.max(sScale.x, sScale.y, sScale.z);
            const rC = cyl.radius * Math.max(cScale.x, cScale.z), hh = (cyl.height * cScale.y) * 0.5;
            const clampedY = Math.max(cPos.y - hh, Math.min(sPos.y, cPos.y + hh));
            const dx = sPos.x - cPos.x, dz = sPos.z - cPos.z, distXZ = Math.sqrt(dx * dx + dz * dz);
            const radialPen = Math.max(0, distXZ - rC), dy = sPos.y - clampedY;
            return (radialPen * radialPen + dy * dy) <= (rS * rS);
        }

        const trisA = this.getWorldTriangles(posA), trisB = other.getWorldTriangles(posB);
        if (trisA && trisB) {
            for (let tri1 of trisA) for (let tri2 of trisB) {
                if (ColliderBody.triTriOverlap(tri1, tri2)) return true;
            }
            return false;
        }
        return true;
    }
}

export class MeshObject {
    /**
     * @param {string} type - "box", "pyramid", "sphere", "cylinder", "torus", "plane"
     * @param {Material} material
     * @param {object} options - { smoothNormals: boolean }
     */
    constructor(type = "box", material = new Material(), options = {}) {
        this.type = type;
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Vector3(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);
        this.material = material;
        this.customPoints = [];
        this.customUVs = [];
        this.boundingRadius = 1.5;
        this.receiveShadows = true;

        // Automatically enable smooth normals on curved surfaces unless explicitly overridden
        const curvedTypes = ["sphere", "cylinder", "torus"];
        this.smoothNormals = options.smoothNormals !== undefined
            ? options.smoothNormals
            : curvedTypes.includes(type.toLowerCase());

        this._vBuffer = null;
        this._nBuffer = null;
        this._uvBuffer = null;
        this._gl = null;

        this.initGeometry();
        const colType = type.charAt(0).toUpperCase() + type.slice(1);
        this.collider = new ColliderBody(colType, this.radius || 1.0, new Vector3(1, 1, 1), this.height || 2.0, this);
    }

    setSmoothNormals(enabled) {
        this.smoothNormals = Boolean(enabled);
        if (this._gl) {
            this.updateNormalBuffer(this._gl);
        }
        return this;
    }

    initGeometry() {
        const t = this.type.toLowerCase();
        if (t === "box") {
            this.customPoints = [
                // Front
                -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
                -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
                // Back
                 0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,
                 0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
                // Top
                -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
                -0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,
                // Bottom
                -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
                -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
                // Right
                 0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
                 0.5,-0.5, 0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
                // Left
                -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
                -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5
            ];
            const faceUV = [0, 0,  1, 0,  1, 1,   0, 0,  1, 1,  0, 1];
            this.customUVs = [...faceUV, ...faceUV, ...faceUV, ...faceUV, ...faceUV, ...faceUV];
            this.boundingRadius = 1.0;
        } else if (t === "plane") {
            this.customPoints = [
                -0.5, 0.0, -0.5,   0.5, 0.0, -0.5,   0.5, 0.0,  0.5,
                -0.5, 0.0, -0.5,   0.5, 0.0,  0.5,  -0.5, 0.0,  0.5
            ];
            this.customUVs = [0, 1,  1, 1,  1, 0,   0, 1,  1, 0,  0, 0];
            this.boundingRadius = 0.8;
        } else if (t === "pyramid") {
            this.customPoints = [
                -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
                -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
                -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.0, 0.5, 0.0,
                 0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.0, 0.5, 0.0,
                 0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,   0.0, 0.5, 0.0,
                -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,   0.0, 0.5, 0.0
            ];
            const sideUV = [0, 0,  1, 0,  0.5, 1];
            this.customUVs = [
                0, 0,  1, 0,  1, 1,   0, 0,  1, 1,  0, 1,
                ...sideUV, ...sideUV, ...sideUV, ...sideUV
            ];
            this.boundingRadius = 1.0;
        } else if (t === "sphere") {
            this.radius = 1.0;
            this.boundingRadius = 1.0;
            const pts = [], uvs = [], bands = 24, r = this.radius;
            for (let lat = 0; lat < bands; lat++) {
                const v1Ratio = lat / bands, v2Ratio = (lat + 1) / bands;
                const t1 = v1Ratio * Math.PI, t2 = v2Ratio * Math.PI;
                for (let lon = 0; lon < bands; lon++) {
                    const u1Ratio = lon / bands, u2Ratio = (lon + 1) / bands;
                    const p1 = u1Ratio * 2 * Math.PI, p2 = u2Ratio * 2 * Math.PI;

                    const v1 = [r * Math.sin(t1) * Math.cos(p1), r * Math.cos(t1), r * Math.sin(t1) * Math.sin(p1)];
                    const v2 = [r * Math.sin(t2) * Math.cos(p1), r * Math.cos(t2), r * Math.sin(t2) * Math.sin(p1)];
                    const v3 = [r * Math.sin(t2) * Math.cos(p2), r * Math.cos(t2), r * Math.sin(t2) * Math.sin(p2)];
                    const v4 = [r * Math.sin(t1) * Math.cos(p2), r * Math.cos(t1), r * Math.sin(t1) * Math.sin(p2)];

                    pts.push(...v1, ...v2, ...v3, ...v1, ...v3, ...v4);
                    uvs.push(
                        1 - u1Ratio, 1 - v1Ratio,
                        1 - u1Ratio, 1 - v2Ratio,
                        1 - u2Ratio, 1 - v2Ratio,
                        1 - u1Ratio, 1 - v1Ratio,
                        1 - u2Ratio, 1 - v2Ratio,
                        1 - u2Ratio, 1 - v1Ratio
                    );
                }
            }
            this.customPoints = pts;
            this.customUVs = uvs;
        } else if (t === "cylinder") {
            this.radius = 0.8;
            this.height = 2.0;
            this.boundingRadius = 1.5;
            const pts = [], uvs = [], segs = 32, r = this.radius, h = this.height / 2;
            for (let i = 0; i < segs; i++) {
                const u1 = i / segs, u2 = (i + 1) / segs;
                const a1 = u1 * 2 * Math.PI, a2 = u2 * 2 * Math.PI;
                const x1 = r * Math.cos(a1), z1 = r * Math.sin(a1);
                const x2 = r * Math.cos(a2), z2 = r * Math.sin(a2);

                // Top cap
                pts.push(0, h, 0, x1, h, z1, x2, h, z2);
                uvs.push(0.5, 0.5, 0.5 + 0.5 * Math.cos(a1), 0.5 + 0.5 * Math.sin(a1), 0.5 + 0.5 * Math.cos(a2), 0.5 + 0.5 * Math.sin(a2));

                // Bottom cap
                pts.push(0, -h, 0, x2, -h, z2, x1, -h, z1);
                uvs.push(0.5, 0.5, 0.5 + 0.5 * Math.cos(a2), 0.5 + 0.5 * Math.sin(a2), 0.5 + 0.5 * Math.cos(a1), 0.5 + 0.5 * Math.sin(a1));

                // Side wall
                pts.push(x1, h, z1, x1, -h, z1, x2, -h, z2);
                pts.push(x1, h, z1, x2, -h, z2, x2, h, z2);
                uvs.push(u1, 1, u1, 0, u2, 0, u1, 1, u2, 0, u2, 1);
            }
            this.customPoints = pts;
            this.customUVs = uvs;
        } else if (t === "torus") {
            this.radius = 1.0;
            this.tubeRadius = 0.35;
            this.boundingRadius = 1.4;
            const pts = [], uvs = [], majorSegs = 32, minorSegs = 18;
            const R = this.radius, r = this.tubeRadius;

            const getTorusVertex = (u, v) => {
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI * 2;
                return [
                    (R + r * Math.cos(phi)) * Math.cos(theta),
                    r * Math.sin(phi),
                    (R + r * Math.cos(phi)) * Math.sin(theta)
                ];
            };

            for (let i = 0; i < majorSegs; i++) {
                const u1 = i / majorSegs, u2 = (i + 1) / majorSegs;
                for (let j = 0; j < minorSegs; j++) {
                    const v1 = j / minorSegs, v2 = (j + 1) / minorSegs;
                    const p1 = getTorusVertex(u1, v1);
                    const p2 = getTorusVertex(u2, v1);
                    const p3 = getTorusVertex(u2, v2);
                    const p4 = getTorusVertex(u1, v2);

                    pts.push(...p1, ...p2, ...p3, ...p1, ...p3, ...p4);
                    uvs.push(u1, v1, u2, v1, u2, v2, u1, v1, u2, v2, u1, v2);
                }
            }
            this.customPoints = pts;
            this.customUVs = uvs;
        }
    }

    /**
     * Computes either flat face normals or area-weighted smooth vertex normals.
     * Smooth normals weld coincident vertex positions while preserving sharp creases
     * on non-smooth meshes (such as boxes) or when smoothNormals is false.
     */
    computeNormals() {
        const pts = this.customPoints;
        const normals = new Array(pts.length).fill(0);

        if (!this.smoothNormals) {
            for (let i = 0; i < pts.length; i += 9) {
                const p1 = new Vector3(pts[i], pts[i + 1], pts[i + 2]);
                const p2 = new Vector3(pts[i + 3], pts[i + 4], pts[i + 5]);
                const p3 = new Vector3(pts[i + 6], pts[i + 7], pts[i + 8]);
                const n = p2.sub(p1).cross(p3.sub(p1)).normalize();
                normals[i] = n.x;     normals[i + 1] = n.y; normals[i + 2] = n.z;
                normals[i + 3] = n.x; normals[i + 4] = n.y; normals[i + 5] = n.z;
                normals[i + 6] = n.x; normals[i + 7] = n.y; normals[i + 8] = n.z;
            }
            return normals;
        }

        // Smooth Normals: Accumulate area-weighted face normals per unique spatial position
        const normalMap = new Map();
        const keyFor = (x, y, z) => `${Math.round(x * 10000)},${Math.round(y * 10000)},${Math.round(z * 10000)}`;

        for (let i = 0; i < pts.length; i += 9) {
            const p1 = new Vector3(pts[i], pts[i + 1], pts[i + 2]);
            const p2 = new Vector3(pts[i + 3], pts[i + 4], pts[i + 5]);
            const p3 = new Vector3(pts[i + 6], pts[i + 7], pts[i + 8]);

            // Un-normalized cross product weights larger triangles proportionally
            const weightedNormal = p2.sub(p1).cross(p3.sub(p1));
            if (weightedNormal.magnitude() < 1e-8) continue;

            for (let v = 0; v < 3; v++) {
                const idx = i + v * 3;
                const key = keyFor(pts[idx], pts[idx + 1], pts[idx + 2]);
                const acc = normalMap.get(key) || new Vector3(0, 0, 0);
                normalMap.set(key, acc.add(weightedNormal));
            }
        }

        for (let i = 0; i < pts.length; i += 3) {
            const key = keyFor(pts[i], pts[i + 1], pts[i + 2]);
            const smoothed = (normalMap.get(key) || new Vector3(0, 1, 0)).normalize();
            normals[i] = smoothed.x;
            normals[i + 1] = smoothed.y;
            normals[i + 2] = smoothed.z;
        }

        return normals;
    }

    ensureUVs() {
        const expectedLen = (this.customPoints.length / 3) * 2;
        if (this.customUVs && this.customUVs.length === expectedLen) {
            return this.customUVs;
        }
        // Auto-generate planar/triplanar UVs if custom mesh points were provided without UVs
        const autoUVs = [];
        for (let i = 0; i < this.customPoints.length; i += 3) {
            const x = this.customPoints[i];
            const y = this.customPoints[i + 1];
            const z = this.customPoints[i + 2];
            autoUVs.push(x + z + 0.5, y + 0.5);
        }
        this.customUVs = autoUVs;
        return autoUVs;
    }

    updateNormalBuffer(gl) {
        if (!gl || !this.customPoints?.length) return;
        if (this._nBuffer) gl.deleteBuffer(this._nBuffer);
        this._nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.computeNormals()), gl.STATIC_DRAW);
    }

    initBuffers(gl) {
        if (!gl || !this.customPoints?.length) return;
        this._gl = gl;
        if (this._vBuffer) gl.deleteBuffer(this._vBuffer);
        if (this._nBuffer) gl.deleteBuffer(this._nBuffer);
        if (this._uvBuffer) gl.deleteBuffer(this._uvBuffer);

        this._vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.customPoints), gl.STATIC_DRAW);

        this.updateNormalBuffer(gl);

        this._uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.ensureUVs()), gl.STATIC_DRAW);
    }
}

export class Raycaster {
    constructor() { this.origin = new Vector3(); this.direction = new Vector3(); }
    setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera) {
        const nx = (screenX / canvasWidth) * 2 - 1;
        const ny = -(screenY / canvasHeight) * 2 + 1;
        this.origin = camera.position;

        const aspect = (canvasWidth || 1) / (canvasHeight || 1);
        let dx = nx * camera.fovScale * aspect;
        let dy = ny * camera.fovScale;
        let dz = 1;

        const radPitch = (camera.pitch || 0) * Math.PI / 180;
        const py = dy * Math.cos(radPitch) - dz * Math.sin(radPitch);
        const pz = dy * Math.sin(radPitch) + dz * Math.cos(radPitch);

        const radYaw = (camera.yaw || 0) * Math.PI / 180;
        const rx = dx * Math.cos(radYaw) - pz * Math.sin(radYaw);
        const rz = dx * Math.sin(radYaw) + pz * Math.cos(radYaw);

        this.direction = new Vector3(rx, py, rz).normalize();
    }

    static transformVertex(vx, vy, vz, obj) {
        let x = vx * obj.scale.x, y = vy * obj.scale.y, z = vz * obj.scale.z;
        const rx = (obj.rotation.x || 0) * Math.PI / 180;
        const ry = (obj.rotation.y || 0) * Math.PI / 180;
        const rz = (obj.rotation.z || 0) * Math.PI / 180;

        let y1 = y * Math.cos(rx) - z * Math.sin(rx), z1 = y * Math.sin(rx) + z * Math.cos(rx);
        let x2 = x * Math.cos(ry) + z1 * Math.sin(ry), z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
        let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz), y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);

        return new Vector3(x3 + obj.position.x, y3 + obj.position.y, z2 + obj.position.z);
    }

    intersectTriangle(v0, v1, v2) {
        const EPSILON = 1e-6;
        const edge1 = v1.sub(v0), edge2 = v2.sub(v0);
        const h = this.direction.cross(edge2);
        const a = edge1.dot(h);
        if (a > -EPSILON && a < EPSILON) return null;

        const f = 1.0 / a;
        const s = this.origin.sub(v0);
        const u = f * s.dot(h);
        if (u < 0.0 || u > 1.0) return null;

        const q = s.cross(edge1);
        const v = f * this.direction.dot(q);
        if (v < 0.0 || u + v > 1.0) return null;

        const t = f * edge2.dot(q);
        return t > EPSILON ? t : null;
    }

    intersectObject(obj) {
        const maxScale = Math.max(obj.scale.x, obj.scale.y, obj.scale.z);
        const r = obj.boundingRadius * maxScale;
        const oc = this.origin.sub(obj.position);
        const b = oc.dot(this.direction);
        const c = oc.dot(oc) - (r * r);
        if (b * b - c < 0) return { hit: false };

        const pts = obj.customPoints;
        if (!pts || !pts.length) {
            const dist = -b - Math.sqrt(b * b - c);
            return dist >= 0 ? { hit: true, distance: dist, point: this.origin.add(this.direction.mult(dist)) } : { hit: false };
        }

        let closest = Infinity;
        for (let i = 0; i < pts.length; i += 9) {
            const v0 = Raycaster.transformVertex(pts[i], pts[i + 1], pts[i + 2], obj);
            const v1 = Raycaster.transformVertex(pts[i + 3], pts[i + 4], pts[i + 5], obj);
            const v2 = Raycaster.transformVertex(pts[i + 6], pts[i + 7], pts[i + 8], obj);
            const t = this.intersectTriangle(v0, v1, v2);
            if (t !== null && t < closest) closest = t;
        }

        return closest < Infinity
            ? { hit: true, distance: closest, point: this.origin.add(this.direction.mult(closest)) }
            : { hit: false };
    }
}

export class GrapeScene3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) { console.error(`Canvas '${canvasId}' not found`); return; }
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) { console.error("WebGL unsupported"); return; }

        this.objects = [];
        this.lights = [];
        this.camera = new Camera();
        this.raycaster = new Raycaster();
        this.realismLevel = 2;
        this.time = 0;
        this._lastFrame = performance.now();

        // Atmospheric distance fog settings
        this.fogColor = { r: 43, g: 26, b: 77 };
        this.fogDensity = 0.015;
        this.enableFog = false;

        this.initWebGLPipeline();
    }

    setRealismLevel(level) { this.realismLevel = level; this.initWebGLPipeline(); }

    setBackgroundColor(r, g, b, a = 1.0) {
        if (!this.gl) return;
        this.fogColor = { r, g, b };
        this.gl.clearColor(r / 255, g / 255, b / 255, a);
    }

    initWebGLPipeline() {
        const gl = this.gl;

        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            attribute vec2 aTexCoord;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform vec2 uTexRepeat;
            uniform vec2 uTexOffset;

            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying vec2 vTexCoord;

            void main() {
                vec4 viewPos = uModelViewMatrix * aVertexPosition;
                gl_Position = uProjectionMatrix * viewPos;
                vViewPos = viewPos.xyz;
                vNormal = mat3(uModelViewMatrix) * aVertexNormal;
                vTexCoord = (aTexCoord * uTexRepeat) + uTexOffset;
            }
        `;

        const fsSource = `
            precision mediump float;

            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying vec2 vTexCoord;

            uniform vec4 uMaterialColor;
            uniform float uMaterialType;
            uniform float uRoughness;
            uniform float uReflectivity;
            uniform vec3 uEmissiveColor;
            uniform float uEmissiveStrength;

            uniform sampler2D uSampler;
            uniform float uHasTexture;

            uniform float uRealismLevel;
            uniform float uInShadow;
            uniform float uTime;

            uniform vec3 uDirLightDir;
            uniform vec3 uDirLightColor;
            uniform float uDirLightIntensity;

            uniform vec3 uSpotLightPos;
            uniform vec3 uSpotLightDir;
            uniform vec3 uSpotLightColor;
            uniform float uSpotLightIntensity;
            uniform float uSpotLightCutoff;

            uniform vec3 uPointLightPos;
            uniform vec3 uPointLightColor;
            uniform float uPointLightIntensity;
            uniform float uPointLightRange;

            uniform vec3 uFogColor;
            uniform float uFogDensity;
            uniform float uEnableFog;

            void main() {
                vec4 baseColor = uMaterialColor;
                if (uHasTexture > 0.5) {
                    vec4 texColor = texture2D(uSampler, vTexCoord);
                    baseColor *= texColor;
                }

                if (uRealismLevel == 0.0) {
                    gl_FragColor = baseColor;
                    return;
                }

                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(-vViewPos);
                float shininess = mix(96.0, 6.0, clamp(uRoughness, 0.0, 1.0));

                // Hemisphere ambient lighting (sky + warm ground bounce)
                float hemiFactor = normal.y * 0.5 + 0.5;
                vec3 ambient = mix(vec3(0.14, 0.11, 0.18), vec3(0.32, 0.34, 0.40), hemiFactor);
                vec3 lighting = ambient;
                vec3 specularTotal = vec3(0.0);

                // Directional Light + Blinn-Phong Specular
                vec3 toDirLight = normalize(-uDirLightDir);
                float dirDiff = max(dot(normal, toDirLight), 0.0) * uDirLightIntensity;
                lighting += uDirLightColor * dirDiff;

                if (dirDiff > 0.0 && uReflectivity > 0.0) {
                    vec3 halfDir = normalize(toDirLight + viewDir);
                    float spec = pow(max(dot(normal, halfDir), 0.0), shininess) * uReflectivity * uDirLightIntensity;
                    specularTotal += uDirLightColor * spec;
                }

                // Spot Light
                if (uSpotLightIntensity > 0.0) {
                    vec3 toSpot = normalize(uSpotLightPos - vViewPos);
                    float theta = dot(toSpot, normalize(-uSpotLightDir));
                    if (theta > uSpotLightCutoff) {
                        float edgeSoftness = clamp((theta - uSpotLightCutoff) / (1.0 - uSpotLightCutoff + 0.001), 0.0, 1.0);
                        float spotDiff = max(dot(normal, toSpot), 0.0) * uSpotLightIntensity * edgeSoftness;
                        lighting += uSpotLightColor * spotDiff;

                        vec3 halfSpot = normalize(toSpot + viewDir);
                        float spotSpec = pow(max(dot(normal, halfSpot), 0.0), shininess) * uReflectivity * uSpotLightIntensity * edgeSoftness;
                        specularTotal += uSpotLightColor * spotSpec;
                    }
                }

                // Point Light with smooth range attenuation
                if (uPointLightIntensity > 0.0) {
                    vec3 pointVec = uPointLightPos - vViewPos;
                    float dist = length(pointVec);
                    if (dist < uPointLightRange) {
                        vec3 toPoint = pointVec / max(dist, 0.0001);
                        float atten = pow(1.0 - (dist / uPointLightRange), 2.0) * uPointLightIntensity;
                        float pointDiff = max(dot(normal, toPoint), 0.0) * atten;
                        lighting += uPointLightColor * pointDiff;

                        vec3 halfPoint = normalize(toPoint + viewDir);
                        float pointSpec = pow(max(dot(normal, halfPoint), 0.0), shininess) * uReflectivity * atten;
                        specularTotal += uPointLightColor * pointSpec;
                    }
                }

                float shadowMult = (uInShadow == 1.0 && uRealismLevel > 0.0) ? 0.45 : 1.0;

                // Material Presets
                if (uMaterialType == 1.0) {
                    // Glass with Fresnel edge glow
                    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
                    baseColor.b += 0.25;
                    baseColor.a = clamp(0.45 + fresnel * 0.45, 0.0, 1.0);
                    specularTotal += vec3(0.4) * fresnel;
                } else if (uMaterialType == 2.0) {
                    // Metallic tinting
                    baseColor.rgb *= 1.25;
                    specularTotal *= (baseColor.rgb * 1.4);
                } else if (uMaterialType == 3.0) {
                    // Hologram scanline shader
                    float scan = 0.75 + 0.25 * sin(vViewPos.y * 28.0 - uTime * 6.0);
                    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
                    baseColor.rgb = mix(baseColor.rgb, vec3(0.55, 0.95, 1.0), rim * 0.7) * scan;
                    baseColor.a = clamp(0.65 + rim * 0.35, 0.0, 1.0);
                    lighting = vec3(1.15);
                }

                vec3 finalRGB = baseColor.rgb * (lighting * shadowMult) + (specularTotal * shadowMult);
                finalRGB += uEmissiveColor * uEmissiveStrength;

                if (uEnableFog > 0.5) {
                    float dist = length(vViewPos);
                    float fogFactor = clamp(exp(-pow(dist * uFogDensity, 2.0)), 0.0, 1.0);
                    finalRGB = mix(uFogColor, finalRGB, fogFactor);
                }

                gl_FragColor = vec4(finalRGB, baseColor.a);
            }
        `;

        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            console.error("Shader linking failed:", gl.getProgramInfoLog(this.shaderProgram));
            return;
        }

        gl.useProgram(this.shaderProgram);

        this.vertexPositionLoc = gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
        this.vertexNormalLoc = gl.getAttribLocation(this.shaderProgram, 'aVertexNormal');
        this.texCoordLoc = gl.getAttribLocation(this.shaderProgram, 'aTexCoord');

        this.uModelViewMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix');
        this.uProjectionMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');
        this.uTexRepeatLoc = gl.getUniformLocation(this.shaderProgram, 'uTexRepeat');
        this.uTexOffsetLoc = gl.getUniformLocation(this.shaderProgram, 'uTexOffset');

        this.uMaterialColorLoc = gl.getUniformLocation(this.shaderProgram, 'uMaterialColor');
        this.uMaterialTypeLoc = gl.getUniformLocation(this.shaderProgram, 'uMaterialType');
        this.uRoughnessLoc = gl.getUniformLocation(this.shaderProgram, 'uRoughness');
        this.uReflectivityLoc = gl.getUniformLocation(this.shaderProgram, 'uReflectivity');
        this.uEmissiveColorLoc = gl.getUniformLocation(this.shaderProgram, 'uEmissiveColor');
        this.uEmissiveStrengthLoc = gl.getUniformLocation(this.shaderProgram, 'uEmissiveStrength');

        this.uSamplerLoc = gl.getUniformLocation(this.shaderProgram, 'uSampler');
        this.uHasTextureLoc = gl.getUniformLocation(this.shaderProgram, 'uHasTexture');

        this.uRealismLevelLoc = gl.getUniformLocation(this.shaderProgram, 'uRealismLevel');
        this.uInShadowLoc = gl.getUniformLocation(this.shaderProgram, 'uInShadow');
        this.uTimeLoc = gl.getUniformLocation(this.shaderProgram, 'uTime');

        this.uDirLightDirLoc = gl.getUniformLocation(this.shaderProgram, 'uDirLightDir');
        this.uDirLightColorLoc = gl.getUniformLocation(this.shaderProgram, 'uDirLightColor');
        this.uDirLightIntensityLoc = gl.getUniformLocation(this.shaderProgram, 'uDirLightIntensity');

        this.uSpotLightPosLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightPos');
        this.uSpotLightDirLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightDir');
        this.uSpotLightColorLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightColor');
        this.uSpotLightIntensityLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightIntensity');
        this.uSpotLightCutoffLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightCutoff');

        this.uPointLightPosLoc = gl.getUniformLocation(this.shaderProgram, 'uPointLightPos');
        this.uPointLightColorLoc = gl.getUniformLocation(this.shaderProgram, 'uPointLightColor');
        this.uPointLightIntensityLoc = gl.getUniformLocation(this.shaderProgram, 'uPointLightIntensity');
        this.uPointLightRangeLoc = gl.getUniformLocation(this.shaderProgram, 'uPointLightRange');

        this.uFogColorLoc = gl.getUniformLocation(this.shaderProgram, 'uFogColor');
        this.uFogDensityLoc = gl.getUniformLocation(this.shaderProgram, 'uFogDensity');
        this.uEnableFogLoc = gl.getUniformLocation(this.shaderProgram, 'uEnableFog');

        gl.clearColor(0.17, 0.10, 0.30, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    compileShader(type, source) {
        const gl = this.gl, shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    addObject(obj) {
        if (this.gl && !obj._vBuffer) {
            obj.initBuffers(this.gl);
        }
        this.objects.push(obj);
        return obj;
    }

    removeObject(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) {
            if (this.gl) {
                if (obj._vBuffer) this.gl.deleteBuffer(obj._vBuffer);
                if (obj._nBuffer) this.gl.deleteBuffer(obj._nBuffer);
                if (obj._uvBuffer) this.gl.deleteBuffer(obj._uvBuffer);
            }
            this.objects.splice(idx, 1);
        }
    }

    addLight(light) { this.lights.push(light); return light; }

    /**
     * Enables built-in drag-to-orbit and WASD/Arrow fly navigation on the canvas
     */
    enableOrbitControls(options = {}) {
        const speed = options.moveSpeed || 0.15;
        const sensitivity = options.lookSensitivity || 0.35;
        let dragging = false, lastX = 0, lastY = 0;
        const keys = new Set();

        this.canvas.addEventListener("mousedown", (e) => {
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });
        window.addEventListener("mouseup", () => { dragging = false; });
        window.addEventListener("mousemove", (e) => {
            if (!dragging) return;
            this.camera.yaw += (e.clientX - lastX) * sensitivity;
            this.camera.pitch = Math.max(-89, Math.min(89, this.camera.pitch + (e.clientY - lastY) * sensitivity));
            lastX = e.clientX;
            lastY = e.clientY;
        });

        window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
        window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

        this._updateControls = () => {
            const yawRad = this.camera.yaw * Math.PI / 180;
            const forward = new Vector3(Math.sin(yawRad), 0, Math.cos(yawRad));
            const right = new Vector3(Math.cos(yawRad), 0, -Math.sin(yawRad));

            if (keys.has("w") || keys.has("arrowup")) this.camera.position = this.camera.position.add(forward.mult(speed));
            if (keys.has("s") || keys.has("arrowdown")) this.camera.position = this.camera.position.sub(forward.mult(speed));
            if (keys.has("d") || keys.has("arrowright")) this.camera.position = this.camera.position.add(right.mult(speed));
            if (keys.has("a") || keys.has("arrowleft")) this.camera.position = this.camera.position.sub(right.mult(speed));
            if (keys.has("e") || keys.has(" ")) this.camera.position.y += speed;
            if (keys.has("q") || keys.has("shift")) this.camera.position.y -= speed;
        };
    }

    checkCollisions() {
        const hits = [];
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const a = this.objects[i], b = this.objects[j];
                if (a.collider && b.collider && a.collider.intersects(b.collider, a.position, b.position)) {
                    hits.push({ a, b });
                }
            }
        }
        return hits;
    }

    createPerspectiveMatrix() {
        const aspect = (this.canvas.width || 1) / (this.canvas.height || 1);
        const f = 1.0 / Math.tan((this.camera.fov * Math.PI / 180) / 2);
        const near = this.camera.near, far = this.camera.far;
        const rangeInv = 1.0 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }

    createModelViewMatrix(obj) {
        const tx = obj.position.x - this.camera.position.x;
        const ty = obj.position.y - this.camera.position.y;
        const tz = -(obj.position.z - this.camera.position.z);

        const radY = (obj.rotation.y - this.camera.yaw) * Math.PI / 180;
        const radX = (obj.rotation.x - this.camera.pitch) * Math.PI / 180;
        const radZ = (obj.rotation.z || 0) * Math.PI / 180;
        const cy = Math.cos(radY), sy = Math.sin(radY);
        const cx = Math.cos(radX), sx = Math.sin(radX);
        const cz = Math.cos(radZ), sz = Math.sin(radZ);

        const sxScale = obj.scale.x, syScale = obj.scale.y, szScale = obj.scale.z;

        return new Float32Array([
            sxScale * (cy * cz + sy * sx * sz),  sxScale * (cx * sz),  sxScale * (-sy * cz + cy * sx * sz), 0,
            syScale * (-cy * sz + sy * sx * cz), syScale * (cx * cz),  syScale * (sy * sz + cy * sx * cz),  0,
            szScale * (sy * cx),                 szScale * (-sx),      szScale * (cy * cx),                 0,
            tx,                                  ty,                   tz,                                  1
        ]);
    }

    render() {
        const gl = this.gl;
        if (!gl) return;

        const now = performance.now();
        const dt = (now - this._lastFrame) / 1000;
        this._lastFrame = now;
        this.time += dt;

        if (this._updateControls) this._updateControls();

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(this.uProjectionMatrixLoc, false, this.createPerspectiveMatrix());
        gl.uniform1f(this.uRealismLevelLoc, parseFloat(this.realismLevel));
        gl.uniform1f(this.uTimeLoc, this.time);

        gl.uniform3f(this.uFogColorLoc, this.fogColor.r / 255, this.fogColor.g / 255, this.fogColor.b / 255);
        gl.uniform1f(this.uFogDensityLoc, this.fogDensity);
        gl.uniform1f(this.uEnableFogLoc, this.enableFog ? 1.0 : 0.0);

        const dirLight = this.lights.find(l => l instanceof AllDirLight);
        if (dirLight) {
            gl.uniform3f(this.uDirLightDirLoc, dirLight.direction.x, dirLight.direction.y, dirLight.direction.z);
            gl.uniform3f(this.uDirLightColorLoc, dirLight.color.r / 255, dirLight.color.g / 255, dirLight.color.b / 255);
            gl.uniform1f(this.uDirLightIntensityLoc, dirLight.intensity);
        } else {
            gl.uniform3f(this.uDirLightDirLoc, 0, -1, 0);
            gl.uniform3f(this.uDirLightColorLoc, 1, 1, 1);
            gl.uniform1f(this.uDirLightIntensityLoc, 0.5);
        }

        const primarySpot = this.lights.find(l => l instanceof SpotLight);
        if (primarySpot) {
            gl.uniform3f(this.uSpotLightPosLoc, primarySpot.position.x - this.camera.position.x, primarySpot.position.y - this.camera.position.y, -(primarySpot.position.z - this.camera.position.z));
            gl.uniform3f(this.uSpotLightDirLoc, primarySpot.direction.x, primarySpot.direction.y, -primarySpot.direction.z);
            gl.uniform3f(this.uSpotLightColorLoc, primarySpot.color.r / 255, primarySpot.color.g / 255, primarySpot.color.b / 255);
            gl.uniform1f(this.uSpotLightIntensityLoc, primarySpot.intensity);
            gl.uniform1f(this.uSpotLightCutoffLoc, primarySpot.cutoff);
        } else {
            gl.uniform1f(this.uSpotLightIntensityLoc, 0.0);
        }

        const primaryPoint = this.lights.find(l => l instanceof PointLight);
        if (primaryPoint) {
            gl.uniform3f(this.uPointLightPosLoc, primaryPoint.position.x - this.camera.position.x, primaryPoint.position.y - this.camera.position.y, -(primaryPoint.position.z - this.camera.position.z));
            gl.uniform3f(this.uPointLightColorLoc, primaryPoint.color.r / 255, primaryPoint.color.g / 255, primaryPoint.color.b / 255);
            gl.uniform1f(this.uPointLightIntensityLoc, primaryPoint.intensity);
            gl.uniform1f(this.uPointLightRangeLoc, primaryPoint.range);
        } else {
            gl.uniform1f(this.uPointLightIntensityLoc, 0.0);
        }

        this.objects.forEach(obj => {
            if (!obj._vBuffer || !obj.customPoints?.length) return;

            let viewVec = obj.position.sub(this.camera.position);
            let dist = viewVec.magnitude();
            let maxScale = Math.max(obj.scale.x, obj.scale.y, obj.scale.z);
            let checkRadius = obj.boundingRadius * maxScale;

            if (dist - checkRadius > this.camera.far || dist + checkRadius < this.camera.near) return;

            let inShadow = 0.0;
            if (obj.receiveShadows && this.realismLevel >= 2.0 && primarySpot) {
                let lightToObj = obj.position.sub(primarySpot.position);
                this.objects.forEach(otherObj => {
                    if (otherObj === obj) return;
                    let oc = primarySpot.position.sub(otherObj.position);
                    let dir = lightToObj.normalize();
                    let b = oc.dot(dir);
                    let r = otherObj.boundingRadius * Math.max(otherObj.scale.x, otherObj.scale.y, otherObj.scale.z);
                    let c = oc.dot(oc) - (r * r);
                    if (b * b - c >= 0) { inShadow = 1.0; }
                });
            }

            const mat = obj.material;
            let typeId = 0.0;
            if (mat.type === "Glass") typeId = 1.0;
            else if (mat.type === "Metallic") typeId = 2.0;
            else if (mat.type === "Hologram") typeId = 3.0;

            gl.uniform4f(this.uMaterialColorLoc, mat.color.r / 255, mat.color.g / 255, mat.color.b / 255, 1.0);
            gl.uniform1f(this.uMaterialTypeLoc, typeId);
            gl.uniform1f(this.uRoughnessLoc, mat.roughness);
            gl.uniform1f(this.uReflectivityLoc, mat.reflectivity);
            gl.uniform3f(this.uEmissiveColorLoc, mat.emissiveColor.r / 255, mat.emissiveColor.g / 255, mat.emissiveColor.b / 255);
            gl.uniform1f(this.uEmissiveStrengthLoc, mat.emissiveStrength);
            gl.uniform1f(this.uInShadowLoc, inShadow);

            // Bind Texture if attached to material
            if (mat.texture && mat.texture.bind(gl, 0)) {
                gl.uniform1i(this.uSamplerLoc, 0);
                gl.uniform1f(this.uHasTextureLoc, 1.0);
                gl.uniform2f(this.uTexRepeatLoc, mat.texture.repeat[0], mat.texture.repeat[1]);
                gl.uniform2f(this.uTexOffsetLoc, mat.texture.offset[0], mat.texture.offset[1]);
            } else {
                gl.uniform1f(this.uHasTextureLoc, 0.0);
                gl.uniform2f(this.uTexRepeatLoc, 1.0, 1.0);
                gl.uniform2f(this.uTexOffsetLoc, 0.0, 0.0);
            }

            gl.uniformMatrix4fv(this.uModelViewMatrixLoc, false, this.createModelViewMatrix(obj));

            gl.bindBuffer(gl.ARRAY_BUFFER, obj._vBuffer);
            gl.vertexAttribPointer(this.vertexPositionLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.vertexPositionLoc);

            if (this.vertexNormalLoc >= 0 && obj._nBuffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, obj._nBuffer);
                gl.vertexAttribPointer(this.vertexNormalLoc, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(this.vertexNormalLoc);
            }

            if (this.texCoordLoc >= 0 && obj._uvBuffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, obj._uvBuffer);
                gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(this.texCoordLoc);
            }

            gl.drawArrays(gl.TRIANGLES, 0, obj.customPoints.length / 3);
        });
    }
}

export function initializeScene(canvasId) {
    const scene = new GrapeScene3D(canvasId);
    scene.camera.position = new Vector3(0, 1, -6);
    scene.addLight(new AllDirLight(new Vector3(-1, -1, 1), { r: 255, g: 255, b: 255 }, 0.7));
    scene.addLight(new SpotLight(new Vector3(0, 4, 0), new Vector3(0, -1, 0), 45));
    scene.addLight(new PointLight(new Vector3(2, 2, -2), { r: 192, g: 132, b: 252 }, 1.0, 20));
    return scene;
}
