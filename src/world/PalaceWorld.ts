import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PICKUPS = [
  { char: 'ㄱ', x: -8, z: 10 }, { char: 'ㄴ', x: 8, z: 9 },
  { char: 'ㅁ', x: -10, z: -2 }, { char: 'ㅅ', x: 9, z: -4 },
  { char: 'ㅇ', x: 0, z: -7 },
];

/** Authored palace kit, batched by material. Collision volumes are independent of detail. */
export class PalaceWorld {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 250);
  readonly renderer: THREE.WebGLRenderer;
  yaw = 0;
  private mode = 'TITLE';
  private player = new THREE.Group();
  private arms: THREE.Group[] = [];
  private legs: THREE.Group[] = [];
  private collected = new Set<string>();
  private tokens = new Map<string, THREE.Group>();
  private batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private time = 0;
  private moving = 0;
  private target = new THREE.Vector3();
  private particles: THREE.Points;
  private burstTime = -10;
  private burstOrigin = new THREE.Vector3();
  private burstVelocity: number[] = [];
  private motes: THREE.Points;
  private frameTotal = 0;
  private frameCount = 0;
  private lastFrameAt = 0;
  private qualityReduced = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene.background = new THREE.Color('#e7b88c');
    this.scene.fog = new THREE.Fog('#dbb397', 38, 110);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vDirection; void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'varying vec3 vDirection; void main(){vec3 d=normalize(vDirection);float h=clamp(d.y*1.4,0.0,1.0);vec3 c=mix(vec3(0.92,0.69,0.48),vec3(0.35,0.58,0.66),pow(h,0.65));float s=max(dot(d,normalize(vec3(-0.65,0.31,-0.6))),0.0);c+=vec3(0.3,0.23,0.12)*pow(s,16.0)+vec3(0.7,0.6,0.4)*pow(s,1200.0);gl_FragColor=vec4(c,1.0);}',
    });
    this.materials.push(skyMaterial);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 12), skyMaterial); sky.frustumCulled = false; this.scene.add(sky);
    this.scene.add(new THREE.HemisphereLight('#c9e8ed', '#aa7350', 2.3));
    const sun = new THREE.DirectionalLight('#ffdb9a', 3.2);
    sun.position.set(-24, 32, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 100 });
    sun.shadow.bias = -0.001; sun.shadow.normalBias = 0.06;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#a9dbe5', 0.8); fill.position.set(20, 12, -30); this.scene.add(fill);
    this.buildWorld(); this.flush(); this.buildPlayer();
    PICKUPS.forEach(p => this.buildToken(p.char, p.x, p.z));
    const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(96 * 3), 3));
    this.particles = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: '#ffe6a0', size: 0.16, transparent: true, opacity: 0, depthWrite: false }));
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
    const motePositions: number[] = [];
    for (let i = 0; i < 75; i++) motePositions.push(Math.sin(i * 127.1) * 22, 0.5 + ((i * 0.618) % 1) * 9, Math.cos(i * 41.3) * 23);
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(motePositions, 3));
    this.motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: '#ffdf94', size: 0.065, transparent: true, opacity: 0.65, depthWrite: false }));
    this.scene.add(this.motes);
    this.camera.position.set(27, 19, 32); this.camera.lookAt(0, 4, -7);
    this.resize();
  }

  private material(color: string, roughness = 0.85) {
    const material = new THREE.MeshStandardMaterial({ color, roughness }); this.materials.push(material); return material;
  }
  private staticMesh(g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0, rz = 0) {
    const mat = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), new THREE.Vector3(sx, sy, sz));
    const geometry = g.index ? g.toNonIndexed() : g.clone();
    geometry.applyMatrix4(mat); geometry.deleteAttribute('uv');
    const list = this.batches.get(m) ?? []; list.push(geometry); this.batches.set(m, list); g.dispose();
  }
  private box(m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) {
    this.staticMesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, 1, 1, 1, ry);
  }
  private flush() {
    this.batches.forEach((list, material) => {
      const merged = mergeGeometries(list); if (merged) { const mesh = new THREE.Mesh(merged, material); mesh.castShadow = material.userData.castShadow !== false; mesh.receiveShadow = material.userData.receiveShadow !== false; this.scene.add(mesh); }
      list.forEach(g => g.dispose());
    }); this.batches.clear();
  }
  private roof(m: THREE.Material, trim: THREE.Material, x: number, y: number, z: number, w: number, d: number, height: number) {
    // Four curved slopes: eaves rise at the corners, tiles follow the authored surface.
    const shape = (u: number, v: number) => y + height * Math.pow(1 - Math.abs(v), 1.75) + 0.58 * Math.pow(Math.abs(u), 5) + 0.3 * Math.pow(Math.abs(v), 8);
    const positions: number[] = []; const n = 24;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const u = a / n * 2 - 1, v = b / n * 2 - 1, u1 = (a + 1) / n * 2 - 1, v1 = (b + 1) / n * 2 - 1;
      for (const [s, t] of [[u, v], [u, v1], [u1, v], [u1, v], [u, v1], [u1, v1]]) positions.push(s * w / 2, shape(s, t) - y, t * d / 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.computeVertexNormals(); this.staticMesh(g, m, x, y, z);
    for (let i = 0; i <= 36; i++) {
      const u = i / 36 * 2 - 1;
      // Keep raised tile seams clear of the tessellated roof, including the ridge.
      const pts = Array.from({ length: 73 }, (_, k) => { const v = k / 72 * 2 - 1; return new THREE.Vector3(x + u * w / 2, shape(u, v) + 0.16, z + v * d / 2); });
      this.staticMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.035, 4, false), trim, 0, 0, 0);
    }
    for (const v of [-1, 1]) {
      const pts = Array.from({ length: 17 }, (_, i) => { const u = i / 16 * 2 - 1; return new THREE.Vector3(x + u * w / 2, shape(u, v), z + v * d / 2); });
      this.staticMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.13, 6, false), trim, 0, 0, 0);
    }
    this.box(trim, x, y + height + 0.16, z, w * 0.94, 0.24, 0.3);
  }
  private buildWorld() {
    const stone = this.material('#a2947d'), paleStone = this.material('#c7b99c'), red = this.material('#853b30'), green = this.material('#34665b');
    const teal = this.material('#6c9b83'), roof = this.material('#293f48'), tile = this.material('#556771');
    // Subpixel decorative seams must not cast/receive unstable shadow-map stripes.
    tile.userData.castShadow = false; tile.userData.receiveShadow = false;
    const gold = this.material('#cbb477'), paper = this.material('#ded1ae'), wood = this.material('#513d30');
    const grass = this.material('#727b4e'), ochre = this.material('#d4b779');
    this.box(grass, 0, -0.35, 0, 140, 0.5, 140);
    this.box(stone, 0, -0.09, 3, 34, 0.22, 36);
    for (let x = -16; x < 16; x += 2) for (let z = -14; z < 20; z += 2) this.box(((x + z) % 6 === 0) ? paleStone : stone, x + 0.98, 0.035, z + 0.98, 1.93, 0.07, 1.93);
    // Ceremonial central walkway, gutter borders, stairs.
    for (const x of [-2.8, 2.8]) this.box(paleStone, x, 0.1, 4, 0.14, 0.18, 30);
    const palace = (x: number, z: number, w: number, d: number, h: number, double = false) => {
      this.box(paleStone, x, 0.45, z, w + 2, 0.9, d + 2);
      this.box(stone, x, 0.94, z, w + 2.25, 0.15, d + 2.25);
      this.box(paper, x, h / 2 + 1, z, w - 0.5, h, d - 0.5);
      for (const front of [-1, 1]) for (let i = 0; i <= 8; i++) {
        const px = x - w / 2 + i * w / 8;
        this.staticMesh(new THREE.CylinderGeometry(0.17, 0.22, h, 8), red, px, 1 + h / 2, z + front * d / 2);
        this.box(green, px, h + 0.8, z + front * (d / 2 + 0.15), 0.65, 0.35, 0.8);
        this.box(gold, px, h + 0.72, z + front * (d / 2 + 0.45), 0.24, 0.1, 0.08);
        if (i < 8) {
          const wx = px + w / 16;
          this.box(wood, wx, 2.7, z + front * (d / 2 - 0.1), w / 8 - 0.26, 2.75, 0.12);
          this.box(paper, wx, 2.8, z + front * (d / 2 + 0.01), w / 8 - 0.4, 2.25, 0.06);
          for (let j = -2; j <= 2; j++) this.box(green, wx + j * w / 48, 2.8, z + front * (d / 2 + 0.07), 0.04, 2.3, 0.06);
          for (let j = 0; j < 7; j++) this.box(green, wx, 1.72 + j * 0.36, z + front * (d / 2 + 0.08), w / 8 - 0.36, 0.035, 0.06);
        }
      }
      this.box(red, x, h + 0.85, z, w + 0.5, 0.35, d + 0.7);
      this.box(teal, x, h + 1.1, z, w + 1, 0.16, d + 1);
      this.roof(roof, tile, x, h + 1.3, z, w + 3, d + 3, 2.1);
      if (double) {
        this.box(red, x, h + 3.4, z, w * 0.73, 1.1, d * 0.7);
        this.box(teal, x, h + 3.85, z, w * 0.78, 0.2, d * 0.8);
        this.roof(roof, tile, x, h + 4, z, w * 0.84, d + 0.5, 1.9);
      }
    };
    palace(0, -16, 22, 8, 4.5, true);
    palace(-23, -6, 10, 18, 3.5); palace(23, -6, 10, 18, 3.5);
    for (let i = 0; i < 5; i++) this.box(paleStone, 0, 0.1 + i * 0.17, -9.2 - i * 0.42, 7, 0.2, 0.6);
    // Framed calligraphic palace sign.
    const sign = this.textSprite('集賢殿', '#e9d5a2', '#253e38', 768, 240); sign.scale.set(4.2, 1.3, 1); sign.position.set(0, 5.2, -11.8); this.scene.add(sign);
    for (const x of [-16.7, 16.7]) {
      this.box(paleStone, x, 0.65, 4, 0.6, 1.3, 28);
      this.box(tile, x, 1.4, 4, 0.85, 0.2, 28);
      for (let z = -9; z <= 18; z += 3) this.box(paleStone, x, 1, z, 0.9, 2, 0.9);
    }
    const foliage = [this.material('#b97936'), this.material('#cc9540'), this.material('#738250'), this.material('#b65932')];
    for (const [x, z, s, c] of [[-15, 13, 1, 0], [15, 14, 1.1, 1], [-19, -14, 1.2, 2], [18, -20, 1.3, 3], [-13, -6, 0.7, 1], [14, -6, 0.8, 0], [-28, 10, 1.4, 3], [28, 10, 1.3, 2]]) {
      this.staticMesh(new THREE.CylinderGeometry(0.2, 0.45, 5 * s, 7), wood, x, 2.5 * s, z);
      for (let b = 0; b < 9; b++) {
        const angle = b * 2.4, r = 1.5 + (b % 3) * 0.5;
        this.staticMesh(new THREE.IcosahedronGeometry(1.8, 1), foliage[c], x + Math.sin(angle) * r * s, (4.6 + Math.sin(b) * 1.3) * s, z + Math.cos(angle) * r * s, s, s * 0.67, s);
      }
    }
    const lantern = this.material('#ffd195'); lantern.emissive.set('#e9a54a'); lantern.emissiveIntensity = 0.4;
    for (const x of [-12, 12]) for (const z of [-7, 4, 15]) {
      this.box(stone, x, 0.3, z, 0.9, 0.6, 0.9);
      this.box(wood, x, 1.4, z, 0.18, 2.3, 0.18);
      this.box(lantern, x, 2.6, z, 0.65, 0.8, 0.65);
      for (const dx of [-0.36, 0.36]) for (const dz of [-0.36, 0.36]) this.box(red, x + dx, 2.6, z + dz, 0.065, 0.9, 0.065);
      this.staticMesh(new THREE.ConeGeometry(0.7, 0.4, 4), roof, x, 3.2, z, 1, 1, 1, Math.PI / 4);
      this.box(wood, x, 2.14, z, 0.8, 0.1, 0.8);
    }
    // Fallen ginkgo leaves are a single material batch, not individual draw calls.
    for (let i = 0; i < 180; i++) {
      const x = Math.sin(i * 29.3) * 15, z = Math.cos(i * 12.7) * 14 + 3;
      this.staticMesh(new THREE.CircleGeometry(0.07 + (i % 3) * 0.025, 3).rotateX(-Math.PI / 2), ochre, x, 0.084, z, 1, 1, 1, i);
    }
    const mountain = this.material('#7a9390');
    const distant = this.material('#a1aaa0');
    // Broad, rounded overlapping ridgelines instead of repeated conical peaks.
    for (let layer = 0; layer < 3; layer++) {
      const vertices: number[] = [];
      const ridge = (x: number) => 5 + layer * 1.8 + 7 * Math.exp(-Math.pow((x + 32 - layer * 9) / 23, 2)) + 9 * Math.exp(-Math.pow((x - 28 + layer * 6) / 29, 2)) + Math.sin(x * 0.19 + layer) * 0.55 + Math.sin(x * 0.43) * 0.2;
      for (let x = -110; x < 110; x += 2) {
        const y0 = ridge(x), y1 = ridge(x + 2), z = -46 - layer * 15;
        vertices.push(x, -2, z, x + 2, -2, z, x, y0, z, x + 2, -2, z, x + 2, y1, z, x, y0, z);
      }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.computeVertexNormals();
      this.staticMesh(geometry, layer === 0 ? mountain : distant, 0, 0, 0);
    }
  }

  private textSprite(text: string, foreground: string, background?: string, w = 256, h = 256) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d')!;
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#c8aa70'; ctx.lineWidth = 12; ctx.strokeRect(8, 8, w - 16, h - 16); }
    ctx.fillStyle = foreground; ctx.font = `600 ${h * 0.69}px "Noto Serif KR", "Malgun Gothic", serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; this.textures.push(texture);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }); this.materials.push(material);
    return new THREE.Sprite(material);
  }
  private buildPlayer() {
    const cloth = this.material('#74a6a1'), ivory = this.material('#e7dfc6'), skin = this.material('#dbb38d'), dark = this.material('#243439');
    const add = (g: THREE.BufferGeometry, m: THREE.Material, y: number, parent = this.player, x = 0, z = 0) => { const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };
    add(new THREE.CylinderGeometry(0.28, 0.56, 1.05, 10), cloth, 0.99);
    add(new THREE.BoxGeometry(0.12, 0.74, 0.07), ivory, 1.22, this.player, 0.1, -0.31).rotation.z = -0.25;
    add(new THREE.CylinderGeometry(0.32, 0.33, 0.12, 10), dark, 0.98);
    add(new THREE.SphereGeometry(0.26, 12, 8), skin, 1.82);
    add(new THREE.CylinderGeometry(0.55, 0.55, 0.055, 20), dark, 2.06);
    add(new THREE.CylinderGeometry(0.22, 0.25, 0.32, 12), dark, 2.22);
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * 0.37, 1.48, 0); this.player.add(arm); this.arms.push(arm);
      add(new THREE.CylinderGeometry(0.15, 0.23, 0.65, 8), cloth, -0.25, arm); add(new THREE.SphereGeometry(0.12, 8, 6), skin, -0.62, arm);
      const leg = new THREE.Group(); leg.position.set(side * 0.2, 0.6, 0); this.player.add(leg); this.legs.push(leg);
      add(new THREE.CylinderGeometry(0.13, 0.12, 0.45, 8), ivory, -0.2, leg); add(new THREE.BoxGeometry(0.25, 0.14, 0.38), dark, -0.5, leg, 0, -0.07);
    }
    this.player.position.set(0, 0.12, 14); this.scene.add(this.player);
  }
  private buildToken(char: string, x: number, z: number) {
    const group = new THREE.Group(); group.position.set(x, 1.8, z);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#f9d88e', transparent: true, opacity: 0.8 }); this.materials.push(ringMat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.018, 6, 48), ringMat); group.add(ring);
    const letter = this.textSprite(char, '#ffe5a6', '#24473f'); letter.scale.set(1.03, 1.03, 1); group.add(letter);
    const ground = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.74, 40), ringMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -1.65; group.add(ground);
    this.tokens.set(char, group); this.scene.add(group);
  }
  resize() { const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  setMode(mode: string) { this.mode = mode; this.frameCamera(1, true); }
  private frameCamera(dt: number, immediate = false) {
    if (this.mode === 'STAGE1') {
      const distance = this.camera.aspect < 0.8 ? 11.5 : 8.7;
      this.target.copy(this.player.position).add(new THREE.Vector3(Math.sin(this.yaw) * distance, 4.8, Math.cos(this.yaw) * distance));
      this.camera.position.lerp(this.target, immediate ? 1 : 1 - Math.exp(-dt * 4));
      this.camera.lookAt(this.player.position.x - Math.sin(this.yaw) * 4.5, 2.4, this.player.position.z - Math.cos(this.yaw) * 4.5);
    } else {
      this.target.set(27 + Math.sin(this.time * 0.045) * 2, 18, 31);
      this.camera.position.lerp(this.target, immediate ? 1 : 1 - Math.exp(-dt * 1.5)); this.camera.lookAt(0, 3.3, -7);
    }
  }
  setCollected(chars: string[]) { this.collected = new Set(chars); this.tokens.forEach((g, char) => { g.visible = !this.collected.has(char); }); }
  setPlayer(x: number, z: number) { this.player.position.x = THREE.MathUtils.clamp(x, -15, 15); this.player.position.z = THREE.MathUtils.clamp(z, -8.3, 18); }
  getPlayer() { return { x: this.player.position.x, z: this.player.position.z }; }
  rotate(delta: number) { this.yaw += delta; }
  move(dx: number, dz: number, dt: number) {
    if (this.mode !== 'STAGE1') return;
    const len = Math.hypot(dx, dz); if (!len) return;
    const scale = 5.4 * Math.min(dt, 0.05) / Math.max(1, len);
    const x = (dx * Math.cos(this.yaw) + dz * Math.sin(this.yaw)) * scale;
    const z = (-dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw)) * scale;
    const valid = (px: number, pz: number) => ![[-13, -6], [14, -6], [-15, 13], [15, 14]].some(([tx, tz]) => Math.hypot(px - tx, pz - tz) < 0.85);
    if (valid(this.player.position.x + x, this.player.position.z)) this.player.position.x = THREE.MathUtils.clamp(this.player.position.x + x, -15.5, 15.5);
    if (valid(this.player.position.x, this.player.position.z + z)) this.player.position.z = THREE.MathUtils.clamp(this.player.position.z + z, -8.3, 18);
    this.player.rotation.y = Math.atan2(-x, -z); this.moving = 0.12;
  }
  nearest() { const p = this.player.position; return PICKUPS.find(item => !this.collected.has(item.char) && Math.hypot(item.x - p.x, item.z - p.z) <= 2.4)?.char ?? null; }
  burst(char: string) {
    const item = PICKUPS.find(p => p.char === char); if (!item) return;
    this.burstOrigin.set(item.x, 1.8, item.z); this.burstTime = this.time; this.burstVelocity = [];
    for (let i = 0; i < 96; i++) { const a = i * 2.399; this.burstVelocity.push(Math.cos(a) * (1 + i % 4), 1 + i % 5 * 0.6, Math.sin(a) * (1 + i % 4)); }
  }
  update(dt: number, elapsed: number) {
    this.time = elapsed; this.moving = Math.max(0, this.moving - dt);
    const stride = this.moving > 0 ? Math.sin(elapsed * 13) * 0.42 : 0;
    this.arms.forEach((g, i) => { g.rotation.x = stride * (i ? -1 : 1); }); this.legs.forEach((g, i) => { g.rotation.x = stride * (i ? 1 : -1); });
    this.tokens.forEach((g, char) => { g.position.y = 1.8 + Math.sin(elapsed * 1.8 + char.charCodeAt(0)) * 0.13; g.children[0].quaternion.copy(this.camera.quaternion); });
    this.frameCamera(dt);
    const age = elapsed - this.burstTime;
    const pm = this.particles.material as THREE.PointsMaterial; pm.opacity = Math.max(0, 1 - age / 1.3);
    if (age < 1.3) { const pos = this.particles.geometry.attributes.position; for (let i = 0; i < 96; i++) pos.setXYZ(i, this.burstOrigin.x + this.burstVelocity[i * 3] * age, this.burstOrigin.y + this.burstVelocity[i * 3 + 1] * age - age * age * 2, this.burstOrigin.z + this.burstVelocity[i * 3 + 2] * age); pos.needsUpdate = true; }
    this.motes.rotation.y = elapsed * 0.009;
  }
  render() {
    const now = performance.now();
    if (this.lastFrameAt && !document.hidden && now - this.lastFrameAt < 500) {
      this.frameTotal += now - this.lastFrameAt; this.frameCount++;
      if (this.frameTotal >= 4000) {
        if (this.frameTotal / this.frameCount > 35 && this.renderer.getPixelRatio() > 0.85) { this.renderer.setPixelRatio(Math.max(0.85, this.renderer.getPixelRatio() - 0.25)); this.qualityReduced = true; this.resize(); }
        this.frameTotal = 0; this.frameCount = 0;
      }
    }
    this.lastFrameAt = now; this.renderer.render(this.scene, this.camera);
  }
  diagnostics() { return { calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, materials: this.materials.length, dpr: this.renderer.getPixelRatio(), qualityReduced: this.qualityReduced, shadowMapSize: 1024, postPasses: 0 }; }
  dispose() { this.scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry.dispose(); }); this.materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose()); this.renderer.dispose(); }
}


