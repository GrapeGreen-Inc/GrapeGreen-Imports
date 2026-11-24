// Module URL: https://github.io

export class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    mult(n) { return new Vector3(this.x * n, this.y * n, this.z * n); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) { return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); }
    magnitude() { return Math.sqrt(this.dot(this)); }
    normalize() { let m = this.magnitude(); return m > 0 ? this.mult(1 / m) : new Vector3(); }
}

export class AllDirLight {
    constructor(direction = new Vector3(0, -1, 0), color = { r: 255, g: 255, b: 255 }, intensity = 0.5) {
        this.direction = direction.normalize(); this.color = color; this.intensity = intensity;
    }
}

export class SpotLight {
    constructor(position = new Vector3(), direction = new Vector3(0, -1, 0), angle = 30, color = { r: 163, g: 230, b: 53 }, intensity = 1.0) {
        this.position = position; this.direction = direction.normalize(); this.cutoff = Math.cos(angle * Math.PI / 180); this.color = color; this.intensity = intensity;
    }
}

export class Camera {
    constructor(position = new Vector3(0, 0, -5), yaw = 0, pitch = 0, fov = 60, near = 0.1, far = 1000.0) {
        this.position = position; this.yaw = yaw; this.pitch = pitch; this.fov = fov; this.fovScale = Math.tan((fov * Math.PI / 180) / 2); this.near = near; this.far = far;
    }
}

export class Material {
    constructor(type = "Standard", color = { r: 163, g: 230, b: 53 }, roughness = 0.5, reflectivity = 0.1) {
        this.type = type; this.color = color; this.roughness = roughness; this.reflectivity = reflectivity;
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
    constructor(type = "box", material = new Material()) {
        this.type = type;
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Vector3(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);
        this.material = material;
        this.customPoints = [];
        this.boundingRadius = 1.5;
        this.receiveShadows = true;
        this._vBuffer = null;
        this._nBuffer = null;
        this.initGeometry();
        const colType = type.charAt(0).toUpperCase() + type.slice(1);
        this.collider = new ColliderBody(colType, this.radius || 1.0, new Vector3(1, 1, 1), this.height || 2.0, this);
    }
    initGeometry() {
        if (this.type === "box") {
            this.customPoints = [
                -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
                -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
                 0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,
                 0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
                -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
                -0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,
                -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
                -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
                 0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
                 0.5,-0.5, 0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
                -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
                -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5
            ];
            this.boundingRadius = 1.0;
        } else if (this.type === "pyramid") {
            this.customPoints = [
                -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
                -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
                -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.0, 0.5, 0.0,
                 0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.0, 0.5, 0.0,
                 0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,   0.0, 0.5, 0.0,
                -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,   0.0, 0.5, 0.0
            ];
            this.boundingRadius = 1.0;
        } else if (this.type === "sphere") {
            this.radius = 1.0;
            this.boundingRadius = 1.0;
            const pts = [], bands = 16, r = this.radius;
            for (let lat = 0; lat < bands; lat++) {
                const t1 = (lat / bands) * Math.PI, t2 = ((lat + 1) / bands) * Math.PI;
                for (let lon = 0; lon < bands; lon++) {
                    const p1 = (lon / bands) * 2 * Math.PI, p2 = ((lon + 1) / bands) * 2 * Math.PI;
                    const v1 = [r * Math.sin(t1) * Math.cos(p1), r * Math.cos(t1), r * Math.sin(t1) * Math.sin(p1)];
                    const v2 = [r * Math.sin(t2) * Math.cos(p1), r * Math.cos(t2), r * Math.sin(t2) * Math.sin(p1)];
                    const v3 = [r * Math.sin(t2) * Math.cos(p2), r * Math.cos(t2), r * Math.sin(t2) * Math.sin(p2)];
                    const v4 = [r * Math.sin(t1) * Math.cos(p2), r * Math.cos(t1), r * Math.sin(t1) * Math.sin(p2)];
                    pts.push(...v1, ...v2, ...v3, ...v1, ...v3, ...v4);
                }
            }
            this.customPoints = pts;
        } else if (this.type === "cylinder") {
            this.radius = 0.8;
            this.height = 2.0;
            this.boundingRadius = 1.5;
            const pts = [], segs = 24, r = this.radius, h = this.height / 2;
            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * 2 * Math.PI, a2 = ((i + 1) / segs) * 2 * Math.PI;
                const x1 = r * Math.cos(a1), z1 = r * Math.sin(a1);
                const x2 = r * Math.cos(a2), z2 = r * Math.sin(a2);
                pts.push(0, h, 0, x1, h, z1, x2, h, z2);
                pts.push(0, -h, 0, x2, -h, z2, x1, -h, z1);
                pts.push(x1, h, z1, x1, -h, z1, x2, -h, z2);
                pts.push(x1, h, z1, x2, -h, z2, x2, h, z2);
            }
            this.customPoints = pts;
        }
    }
    computeNormals() {
        const pts = this.customPoints, normals = [];
        for (let i = 0; i < pts.length; i += 9) {
            const p1 = new Vector3(pts[i], pts[i + 1], pts[i + 2]);
            const p2 = new Vector3(pts[i + 3], pts[i + 4], pts[i + 5]);
            const p3 = new Vector3(pts[i + 6], pts[i + 7], pts[i + 8]);
            const n = p2.sub(p1).cross(p3.sub(p1)).normalize();
            normals.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
        }
        return normals;
    }
    initBuffers(gl) {
        if (!gl || !this.customPoints?.length) return;
        if (this._vBuffer) gl.deleteBuffer(this._vBuffer);
        if (this._nBuffer) gl.deleteBuffer(this._nBuffer);

        this._vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.customPoints), gl.STATIC_DRAW);

        this._nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.computeNormals()), gl.STATIC_DRAW);
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
        this.initWebGLPipeline();
    }

    setRealismLevel(level) { this.realismLevel = level; this.initWebGLPipeline(); }

    initWebGLPipeline() {
        const gl = this.gl;

        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec3 aVertexNormal;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying vec3 vNormal;
            varying vec3 vWorldPos;
            void main() {
                vec4 worldPos = uModelViewMatrix * aVertexPosition;
                gl_Position = uProjectionMatrix * worldPos;
                vWorldPos = worldPos.xyz;
                vNormal = mat3(uModelViewMatrix) * aVertexNormal;
            }
        `;

        const fsSource = `
            precision mediump float;
            varying vec3 vNormal;
            varying vec3 vWorldPos;
            uniform vec4 uMaterialColor;
            uniform float uMaterialType;
            uniform float uRealismLevel;
            uniform float uInShadow;
            uniform vec3 uDirLightDir;
            uniform vec3 uDirLightColor;
            uniform float uDirLightIntensity;
            uniform vec3 uSpotLightPos;
            uniform vec3 uSpotLightDir;
            uniform vec3 uSpotLightColor;
            uniform float uSpotLightIntensity;
            uniform float uSpotLightCutoff;
            void main() {
                vec4 c = uMaterialColor;
                if(uRealismLevel == 0.0) {
                    gl_FragColor = c;
                    return;
                }

                vec3 normal = normalize(vNormal);
                vec3 toDirLight = normalize(-uDirLightDir);
                float dirFactor = max(dot(normal, toDirLight), 0.0) * uDirLightIntensity;
                vec3 lighting = vec3(0.25) + (uDirLightColor * dirFactor);

                if(uSpotLightIntensity > 0.0) {
                    vec3 toSpot = normalize(uSpotLightPos - vWorldPos);
                    float theta = dot(toSpot, normalize(-uSpotLightDir));
                    if(theta > uSpotLightCutoff) {
                        float spotFactor = max(dot(normal, toSpot), 0.0) * uSpotLightIntensity;
                        lighting += uSpotLightColor * spotFactor;
                    }
                }

                float shadowMult = (uInShadow == 1.0 && uRealismLevel > 0.0) ? 0.4 : 1.0;

                if(uMaterialType == 1.0) {
                    c.b += 0.3;
                    c.a = 0.7;
                } else if(uMaterialType == 2.0) {
                    c.rgb *= 1.35;
                }

                c.rgb *= (lighting * shadowMult);
                gl_FragColor = c;
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

        this.uModelViewMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix');
        this.uProjectionMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');
        this.uMaterialColorLoc = gl.getUniformLocation(this.shaderProgram, 'uMaterialColor');
        this.uMaterialTypeLoc = gl.getUniformLocation(this.shaderProgram, 'uMaterialType');
        this.uRealismLevelLoc = gl.getUniformLocation(this.shaderProgram, 'uRealismLevel');
        this.uInShadowLoc = gl.getUniformLocation(this.shaderProgram, 'uInShadow');

        this.uDirLightDirLoc = gl.getUniformLocation(this.shaderProgram, 'uDirLightDir');
        this.uDirLightColorLoc = gl.getUniformLocation(this.shaderProgram, 'uDirLightColor');
        this.uDirLightIntensityLoc = gl.getUniformLocation(this.shaderProgram, 'uDirLightIntensity');

        this.uSpotLightPosLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightPos');
        this.uSpotLightDirLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightDir');
        this.uSpotLightColorLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightColor');
        this.uSpotLightIntensityLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightIntensity');
        this.uSpotLightCutoffLoc = gl.getUniformLocation(this.shaderProgram, 'uSpotLightCutoff');

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
    }

    removeObject(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) {
            if (this.gl) {
                if (obj._vBuffer) this.gl.deleteBuffer(obj._vBuffer);
                if (obj._nBuffer) this.gl.deleteBuffer(obj._nBuffer);
            }
            this.objects.splice(idx, 1);
        }
    }

    addLight(light) { this.lights.push(light); }

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

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(this.uProjectionMatrixLoc, false, this.createPerspectiveMatrix());
        gl.uniform1f(this.uRealismLevelLoc, parseFloat(this.realismLevel));

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
            gl.uniform3f(this.uSpotLightPosLoc, primarySpot.position.x, primarySpot.position.y, -primarySpot.position.z);
            gl.uniform3f(this.uSpotLightDirLoc, primarySpot.direction.x, primarySpot.direction.y, -primarySpot.direction.z);
            gl.uniform3f(this.uSpotLightColorLoc, primarySpot.color.r / 255, primarySpot.color.g / 255, primarySpot.color.b / 255);
            gl.uniform1f(this.uSpotLightIntensityLoc, primarySpot.intensity);
            gl.uniform1f(this.uSpotLightCutoffLoc, primarySpot.cutoff);
        } else {
            gl.uniform1f(this.uSpotLightIntensityLoc, 0.0);
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

            let typeId = obj.material.type === "Glass" ? 1.0 : (obj.material.type === "Metallic" ? 2.0 : 0.0);
            gl.uniform4f(this.uMaterialColorLoc, obj.material.color.r / 255, obj.material.color.g / 255, obj.material.color.b / 255, 1.0);
            gl.uniform1f(this.uMaterialTypeLoc, typeId);
            gl.uniform1f(this.uInShadowLoc, inShadow);
            gl.uniformMatrix4fv(this.uModelViewMatrixLoc, false, this.createModelViewMatrix(obj));

            gl.bindBuffer(gl.ARRAY_BUFFER, obj._vBuffer);
            gl.vertexAttribPointer(this.vertexPositionLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.vertexPositionLoc);

            if (this.vertexNormalLoc >= 0 && obj._nBuffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, obj._nBuffer);
                gl.vertexAttribPointer(this.vertexNormalLoc, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(this.vertexNormalLoc);
            }

            gl.drawArrays(gl.TRIANGLES, 0, obj.customPoints.length / 3);
        });
    }
}

export function initializeScene(canvasId) {
    const scene = new GrapeScene3D(canvasId);
    scene.camera.position = new Vector3(0, 0, -6);
    scene.addLight(new AllDirLight(new Vector3(-1, -1, 1), { r: 255, g: 255, b: 255 }, 0.7));
    scene.addLight(new SpotLight(new Vector3(0, 4, 0), new Vector3(0, -1, 0), 45));
    return scene;
}
