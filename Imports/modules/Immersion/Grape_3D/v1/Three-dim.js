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
    constructor(type = "Box", radius = 0, size = new Vector3()) { this.type = type; this.radius = radius; this.size = size; }
    intersects(other, posA, posB) {
        if (this.type === "Sphere" && other.type === "Sphere") { return posA.sub(posB).magnitude() <= (this.radius + other.radius); }
        return false;
    }
}

export class MeshObject {
    constructor(type = "box", material = new Material()) {
        this.type = type;
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Vector3(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);
        this.material = material;
        this.collider = new ColliderBody(type === "sphere" ? "Sphere" : "Box", 1.0, new Vector3(2, 2, 2));
        this.customPoints = [];
        this.boundingRadius = 1.5;
        this.receiveShadows = true;
        this.initGeometry();
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
}

export class Raycaster {
    constructor() { this.origin = new Vector3(); this.direction = new Vector3(); }
    setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera) {
        let nx = (screenX / canvasWidth) * 2 - 1, ny = -(screenY / canvasHeight) * 2 + 1;
        this.origin = camera.position;
        let rayDir = new Vector3(nx * camera.fovScale * (canvasWidth / canvasHeight), ny * camera.fovScale, 1);
        let radYaw = camera.yaw * Math.PI / 180;
        let rx = rayDir.x * Math.cos(radYaw) - rayDir.z * Math.sin(radYaw);
        let rz = rayDir.x * Math.sin(radYaw) + rayDir.z * Math.cos(radYaw);
        this.direction = new Vector3(rx, rayDir.y, rz).normalize();
    }
    intersectObject(obj) {
        let oc = this.origin.sub(obj.position), b = oc.dot(this.direction), c = oc.dot(oc) - 1.0, h = b * b - c;
        return h >= 0 ? { hit: true, distance: -b - Math.sqrt(h) } : { hit: false };
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
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vNormal = aVertexNormal;
            }
        `;

        const fsSource = `
            precision mediump float;
            varying vec3 vNormal;
            uniform vec4 uMaterialColor;
            uniform float uMaterialType;
            uniform float uRealismLevel;
            uniform float uInShadow;
            void main() {
                vec4 c = uMaterialColor;
                if(uRealismLevel == 0.0) {
                    gl_FragColor = c;
                    return;
                }

                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
                float lightIntensity = max(dot(normal, lightDir), 0.35);

                float shadowMult = 1.0;
                if(uInShadow == 1.0 && uRealismLevel > 0.0) {
                    shadowMult = 0.4;
                }

                if(uMaterialType == 1.0) {
                    c.b += 0.3;
                    c.a = 0.7;
                } else if(uMaterialType == 2.0) {
                    c *= 1.4;
                }

                c.rgb *= (lightIntensity * shadowMult);
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

    addObject(obj) { this.objects.push(obj); }
    addLight(light) { this.lights.push(light); }

    createPerspectiveMatrix() {
        const aspect = (this.canvas.width || 1) / (this.canvas.height || 1);
        const f = 1.0 / Math.tan((this.camera.fov * Math.PI / 180) / 2);
        const near = this.camera.near;
        const far = this.camera.far;
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
        const cosY = Math.cos(radY), sinY = Math.sin(radY);
        const cosX = Math.cos(radX), sinX = Math.sin(radX);

        const sx = obj.scale.x, sy = obj.scale.y, sz = obj.scale.z;

        return new Float32Array([
            sx * cosY,  sx * sinY * sinX,  sx * sinY * cosX, 0,
            0,          sy * cosX,        -sy * sinX,        0,
           -sz * sinY,  sz * cosY * sinX,  sz * cosY * cosX, 0,
            tx,         ty,                tz,               1
        ]);
    }

    render() {
        const gl = this.gl;
        if (!gl) return;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const pMatrix = this.createPerspectiveMatrix();
        gl.uniformMatrix4fv(this.uProjectionMatrixLoc, false, pMatrix);
        gl.uniform1f(this.uRealismLevelLoc, parseFloat(this.realismLevel));

        if (this.vertexNormalLoc >= 0) {
            gl.disableVertexAttribArray(this.vertexNormalLoc);
            gl.vertexAttrib3f(this.vertexNormalLoc, 0.3, 0.8, 0.5);
        }

        const primarySpot = this.lights.find(l => l instanceof SpotLight);

        this.objects.forEach(obj => {
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
                    let c = oc.dot(oc) - 1.0;
                    if (b * b - c >= 0) { inShadow = 1.0; }
                });
            }

            let typeId = obj.material.type === "Glass" ? 1.0 : (obj.material.type === "Metallic" ? 2.0 : 0.0);
            gl.uniform4f(
                this.uMaterialColorLoc,
                obj.material.color.r / 255,
                obj.material.color.g / 255,
                obj.material.color.b / 255,
                1.0
            );
            gl.uniform1f(this.uMaterialTypeLoc, typeId);
            gl.uniform1f(this.uInShadowLoc, inShadow);

            const mvMatrix = this.createModelViewMatrix(obj);
            gl.uniformMatrix4fv(this.uModelViewMatrixLoc, false, mvMatrix);

            const pts = obj.customPoints?.length ? obj.customPoints : [];
            if (!pts.length) return;

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
            gl.vertexAttribPointer(this.vertexPositionLoc, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.vertexPositionLoc);
            gl.drawArrays(gl.TRIANGLES, 0, pts.length / 3);
        });
    }
}

export function initializeScene(canvasId) {
    const scene = new GrapeScene3D(canvasId);
    scene.camera.position = new Vector3(0, 0, -6);
    scene.addLight(new AllDirLight(new Vector3(-1, -1, -1), { r: 255, g: 255, b: 255 }, 0.5));
    scene.addLight(new SpotLight(new Vector3(0, 4, 0), new Vector3(0, -1, 0), 45));
    return scene;
}
