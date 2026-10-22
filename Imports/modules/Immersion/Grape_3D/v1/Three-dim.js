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
    constructor(position = new Vector3(0, 0, -5), yaw = 0, pitch = 0, fov = 60) {
        this.position = position; this.yaw = yaw; this.pitch = pitch; this.fov = fov; this.fovScale = Math.tan((fov * Math.PI / 180) / 2);
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
        this.type = type; this.position = new Vector3(0, 0, 0); this.rotation = new Vector3(0, 0, 0); this.scale = new Vector3(1, 1, 1); this.material = material; this.collider = new ColliderBody(type === "sphere" ? "Sphere" : "Box", 1.0, new Vector3(2, 2, 2)); this.customPoints = []; this.initGeometry();
    }
    initGeometry() {
        if (this.type === "box") { this.customPoints = [-0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5]; }
        else if (this.type === "pyramid") { this.customPoints = [-0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.0,0.5,0.0]; }
        else if (this.type === "sphere") { this.radius = 1.0; }
        else if (this.type === "cylinder") { this.radius = 0.8; this.height = 2.0; }
    }
}
export class Raycaster {
    constructor() { this.origin = new Vector3(); this.direction = new Vector3(); }
    setFromCamera(screenX, screenY, canvasWidth, canvasHeight, camera) {
        let nx = (screenX / canvasWidth) * 2 - 1, ny = -(screenY / canvasHeight) * 2 + 1; this.origin = camera.position;
        let rayDir = new Vector3(nx * camera.fovScale * (canvasWidth / canvasHeight), ny * camera.fovScale, 1);
        let radYaw = camera.yaw * Math.PI / 180, rx = rayDir.x * Math.cos(radYaw) - rayDir.z * Math.sin(radYaw), rz = rayDir.x * Math.sin(radYaw) + rayDir.z * Math.cos(radYaw);
        this.direction = new Vector3(rx, rayDir.y, rz).normalize();
    }
    intersectObject(obj) {
        let oc = this.origin.sub(obj.position), b = oc.dot(this.direction), c = oc.dot(oc) - 1.0, h = b * b - c;
        return h >= 0 ? { hit: true, distance: -b - Math.sqrt(h) } : { hit: false };
    }
}
export class GrapeScene3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId); this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) { console.error("WebGL unsupported"); return; }
        this.objects = []; this.lights = []; this.camera = new Camera(); this.raycaster = new Raycaster(); this.initWebGLPipeline();
    }
    initWebGLPipeline() {
        const gl = this.gl;
        const vsSource = `attribute vec4 aVertexPosition;uniform mat4 uModelViewMatrix;uniform mat4 uProjectionMatrix;void main(){gl_Position=uProjectionMatrix*uModelViewMatrix*aVertexPosition;}`;
        const fsSource = `precision mediump float;uniform vec4 uMaterialColor;uniform float uMaterialType;void main(){vec4 c=uMaterialColor;if(uMaterialType==1.0){c.b+=0.3;c.a=0.7;}else if(uMaterialType==2.0){c*=1.4;}gl_FragColor=c;}`;
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource), fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        this.shaderProgram = gl.createProgram(); gl.attachShader(this.shaderProgram, vertexShader); gl.attachShader(this.shaderProgram, fragmentShader); gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) { console.error("Shader linking failed"); return; }
        gl.useProgram(this.shaderProgram); this.vertexPositionLoc = gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
        this.uModelViewMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'); this.uProjectionMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');
        this.uMaterialColorLoc = gl.getUniformLocation(this.shaderProgram, 'uMaterialColor'); this.uMaterialTypeLoc = gl.getUniformLocation(this.shaderProgram, 'uMaterialType');
        gl.clearColor(0.17, 0.10, 0.30, 1.0); gl.enable(gl.DEPTH_TEST);
    }
    compileShader(type, source) {
        const gl = this.gl, shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null; }
        return shader;
    }
    addObject(obj) { this.objects.push(obj); }
    addLight(light) { this.lights.push(light); }
    render() {
        const gl = this.gl; if (!gl) return; gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const pMatrix = new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]); gl.uniformMatrix4fv(this.uProjectionMatrixLoc, false, pMatrix);
        this.objects.forEach(obj => {
            let typeId = obj.material.type === "Glass" ? 1.0 : (obj.material.type === "Metallic" ? 2.0 : 0.0);
            gl.uniform4f(this.uMaterialColorLoc, obj.material.color.r / 255, obj.material.color.g / 255, obj.material.color.b / 255, 1.0); gl.uniform1f(this.uMaterialTypeLoc, typeId);
            const mvMatrix = new Float32Array([obj.scale.x,0,0,0,0,obj.scale.y,0,0,0,0,obj.scale.z,0,obj.position.x,obj.position.y,obj.position.z,1]); gl.uniformMatrix4fv(this.uModelViewMatrixLoc, false, mvMatrix);
            const pts = obj.customPoints.length ? obj.customPoints :, buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
            gl.vertexAttribPointer(this.vertexPositionLoc, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(this.vertexPositionLoc); gl.drawArrays(gl.TRIANGLE_STRIP, 0, pts.length / 3);
        });
    }
}
