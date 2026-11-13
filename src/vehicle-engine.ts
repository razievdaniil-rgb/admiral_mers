import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { assetUrl } from "./assets";

type Vehicle = {
  group: THREE.Group;
  materials: { material: THREE.Material; opacity: number }[];
  wires: THREE.Mesh[];
  particles: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  born: number;
  entrance: boolean;
};
export type VehicleEngine = ReturnType<typeof createVehicleEngine>;
export function createVehicleEngine(
  host: HTMLElement,
  hero: boolean,
  status: (state: "loading" | "ready" | "error") => void,
) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6),
  );
  renderer.setClearColor(0x08090b, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  camera.position.set(6.8, 3.2, 6.8);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.5;
  controls.enabled = matchMedia("(hover:hover) and (pointer:fine)").matches;
  renderer.domElement.style.touchAction = "pan-y";
  controls.update();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentScene = new RoomEnvironment();
  const environment = pmrem.fromScene(environmentScene, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.8;
  environmentScene.dispose();
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x242933, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(4, 7, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcbdcff, 2.2);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  const front = new THREE.DirectionalLight(0xffffff, 1.3);
  front.position.set(7, 1, -5);
  scene.add(front);
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,.8)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6.3, 3.4),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.015;
  scene.add(floor);
  const scan = {
    point: { value: new THREE.Vector3(0, 0.7, 0) },
    radius: { value: 1.05 },
    strength: { value: 0 },
  };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let current: Vehicle | null = null,
    outgoing: Vehicle | null = null;
  let disposed = false,
    visible = true,
    frame = 0,
    request = 0,
    elapsed = 0,
    previous = 0,
    scanning = false,
    moving = true,
    dragging = false,
    lastInteraction = -100;
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const scanMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPoint: scan.point,
      uRadius: scan.radius,
      uStrength: scan.strength,
    },
    vertexShader:
      "varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}",
    fragmentShader:
      "uniform vec3 uPoint;uniform float uRadius;uniform float uStrength;varying vec3 vWorld;void main(){float a=(1.-smoothstep(uRadius*.65,uRadius,distance(vWorld,uPoint)))*uStrength;if(a<.015)discard;gl_FragColor=vec4(.58,.82,1.,a*.65);}",
    wireframe: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  function disposeObject(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>(),
      textures = new Set<THREE.Texture>();
    root.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m === scanMaterial) continue;
          materials.add(m);
          for (const v of Object.values(m))
            if (v instanceof THREE.Texture) textures.add(v);
        }
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    scene.remove(root);
  }
  function setup(gltf: THREE.Group, entrance: boolean): Vehicle {
    const group = new THREE.Group();
    group.add(gltf);
    scene.add(group);
    gltf.updateMatrixWorld(true);
    const sourceBounds = new THREE.Box3().setFromObject(gltf);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const span = Math.max(sourceSize.x, sourceSize.z);
    const backdrops: THREE.Object3D[] = [];
    gltf.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const dimensions = new THREE.Box3()
        .setFromObject(object)
        .getSize(new THREE.Vector3());
      if (
        dimensions.y < span * 0.001 &&
        dimensions.x > span * 0.4 &&
        dimensions.z > span * 0.4
      )
        backdrops.push(object);
    });
    backdrops.forEach((object) => object.removeFromParent());
    let box = new THREE.Box3().setFromObject(gltf);
    const originalSize = box.getSize(new THREE.Vector3());
    if (originalSize.z > originalSize.x) gltf.rotation.y = Math.PI / 2;
    gltf.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(gltf);
    const size = box.getSize(new THREE.Vector3()),
      center = box.getCenter(new THREE.Vector3());
    const scale = 5 / Math.max(size.x, size.z);
    gltf.scale.multiplyScalar(scale);
    gltf.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    gltf.updateMatrixWorld(true);
    const meshes: THREE.Mesh[] = [];
    gltf.traverse((o) => {
      if (o instanceof THREE.Mesh) meshes.push(o);
    });
    const materials: Vehicle["materials"] = [],
      wires: THREE.Mesh[] = [];
    const remapped = new Map<THREE.Material, THREE.Material>();
    for (const mesh of meshes) {
      const process = (original: THREE.Material) => {
        if (remapped.has(original)) return remapped.get(original)!;
        const m = original.clone();
        if (m instanceof THREE.MeshStandardMaterial && /paint/i.test(m.name)) {
          m.color.set("#a6afb9");
          m.metalness = 0.78;
          m.roughness = 0.28;
        }
        if (m instanceof THREE.MeshStandardMaterial && /glass/i.test(m.name)) {
          m.color.set("#50647b");
          m.roughness = Math.max(0.09, m.roughness);
          m.metalness = 0.12;
        }
        if (
          m instanceof THREE.MeshStandardMaterial &&
          m.name === "Scene_-_Root"
        ) {
          m.color.set("#5e6d7f");
          m.metalness = 0.45;
          m.roughness = 0.38;
        }
        m.transparent = true;
        m.forceSinglePass = true;
        m.onBeforeCompile = (shader) => {
          shader.uniforms.uScanPoint = scan.point;
          shader.uniforms.uScanRadius = scan.radius;
          shader.uniforms.uScanStrength = scan.strength;
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vScanWorld;",
            )
            .replace(
              "#include <project_vertex>",
              "#include <project_vertex>\nvScanWorld=(modelMatrix*vec4(transformed,1.)).xyz;",
            );
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vScanWorld;uniform vec3 uScanPoint;uniform float uScanRadius;uniform float uScanStrength;",
            )
            .replace(
              "#include <dithering_fragment>",
              "#include <dithering_fragment>\nfloat lens=(1.-smoothstep(uScanRadius*.7,uScanRadius,distance(vScanWorld,uScanPoint)))*uScanStrength;gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.35,.65,.9),lens*.38);gl_FragColor.a*=1.-lens*.78;",
            );
        };
        m.customProgramCacheKey = () => "admiral-surface-scan-v1";
        remapped.set(original, m);
        materials.push({ material: m, opacity: original.opacity });
        return m;
      };
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(process)
        : process(mesh.material);
      const wire = new THREE.Mesh(mesh.geometry, scanMaterial);
      wire.visible = false;
      mesh.add(wire);
      wires.push(wire);
    }
    group.updateMatrixWorld(true);
    const count = innerWidth < 700 ? 2600 : 6500;
    const positions = new Float32Array(count * 3),
      starts = new Float32Array(count * 3),
      seeds = new Float32Array(count);
    const entries = meshes.filter((m) => m.geometry.getAttribute("position"));
    const total = entries.reduce(
      (n, m) => n + m.geometry.getAttribute("position").count,
      0,
    );
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      let pick = Math.floor(Math.random() * total),
        mesh = entries[0];
      for (const candidate of entries) {
        const n = candidate.geometry.getAttribute("position").count;
        if (pick < n) {
          mesh = candidate;
          break;
        }
        pick -= n;
      }
      v.fromBufferAttribute(
        mesh.geometry.getAttribute("position"),
        pick,
      ).applyMatrix4(mesh.matrixWorld);
      v.toArray(positions, i * 3);
      v.set((Math.random() - 0.5) * 2.3, (Math.random() - 0.5) * 2.3, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()
        .multiplyScalar(7 + Math.random() * 4)
        .add(camera.position);
      v.toArray(starts, i * 3);
      seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aStart", new THREE.BufferAttribute(starts, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: entrance ? 0 : 1 },
        uFade: { value: entrance ? 1 : 0 },
        uDpr: { value: renderer.getPixelRatio() },
        uCarMatrix: { value: group.matrixWorld },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader:
        "attribute vec3 aStart;attribute float aSeed;uniform float uProgress;uniform float uDpr;uniform mat4 uCarMatrix;void main(){float t=clamp((uProgress-aSeed*.12)/.88,0.,1.);t=t*t*(3.-2.*t);vec3 target=(uCarMatrix*vec4(position,1.)).xyz;vec3 p=mix(aStart,target,t);p.y+=sin(t*3.14159)*(1.-t)*sin(aSeed*30.)*.5;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);gl_PointSize=uDpr*(1.2+aSeed*1.4);}",
      fragmentShader:
        "uniform float uFade;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.75,.85,1.,uFade*(1.-smoothstep(.12,.5,d)));}",
    });
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);
    group.rotation.y = -0.3;
    return { group, materials, wires, particles, born: elapsed, entrance };
  }
  async function load(file: string, entrance = false) {
    const token = ++request;
    status("loading");
    try {
      const gltf = await loader.loadAsync(assetUrl("models/" + file));
      if (disposed || token !== request) {
        disposeObject(gltf.scene);
        return;
      }
      if (outgoing) {
        disposeObject(outgoing.group);
        disposeObject(outgoing.particles);
      }
      outgoing = current;
      current = setup(gltf.scene, entrance && !reduced.matches);
      if (outgoing) current.group.position.x = 6.5;
      host.dataset.model = file;
      host.dataset.phase = current.entrance ? "assembling" : "ready";
      resize();
      if (!outgoing) status("ready");
    } catch {
      if (!disposed && token === request) status("error");
    }
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const modelHeight = current
      ? new THREE.Box3()
          .setFromObject(current.group)
          .getSize(new THREE.Vector3()).y
      : 1.6;
    camera.fov = hero
      ? w < 700
        ? 38
        : 30
      : w < 700
        ? 27
        : modelHeight > 2.1
          ? 22
          : modelHeight > 1.8
            ? 20
            : 18;
    if (w < 700 && hero) camera.position.set(8.8, 4.4, 8.8);
    else
      camera.position.set(hero ? 5.4 : 6.2, hero ? 2.6 : 2.2, hero ? 5.4 : 6.2);
    camera.setViewOffset(w, h, 0, hero ? h * 0.06 : 0, w, h);
    camera.updateProjectionMatrix();
    controls.update();
  }
  function render(now: number) {
    if (disposed) return;
    if (
      previous &&
      now - previous < (innerWidth < 700 ? 1000 / 30 : 1000 / 45)
    ) {
      frame = requestAnimationFrame(render);
      return;
    }
    const dt = previous ? Math.min((now - previous) / 1000, 1) : 0;
    previous = now;
    if (!document.hidden && visible) {
      elapsed += dt;
      const car = current;
      if (car) {
        const age = elapsed - car.born;
        const progress =
          car.entrance && !reduced.matches
            ? THREE.MathUtils.clamp(age / 3.5, 0, 1)
            : 1;
        const body =
          car.entrance && !reduced.matches
            ? THREE.MathUtils.smoothstep(age, 2.6, 4.2)
            : 1;
        car.particles.material.uniforms.uProgress.value = progress;
        car.particles.material.uniforms.uFade.value = 1 - body;
        car.particles.visible = body < 1;
        for (const m of car.materials) m.material.opacity = m.opacity * body;
        if (outgoing) {
          const p = reduced.matches
            ? 1
            : THREE.MathUtils.smoothstep(age, 0, 1.1);
          car.group.position.x = 6.5 * (1 - p);
          outgoing.group.position.x = -6.5 * p;
          if (p === 1) {
            disposeObject(outgoing.group);
            disposeObject(outgoing.particles);
            outgoing = null;
            status("ready");
          }
        } else if (car.entrance && age < 6) {
          car.group.position.x =
            -0.45 * (1 - THREE.MathUtils.smoothstep(age, 3.8, 5.7));
        }
        if (progress === 1 && body === 1 && !outgoing)
          host.dataset.phase = "ready";
        if (
          moving &&
          !dragging &&
          !reduced.matches &&
          elapsed - lastInteraction > 3
        ) {
          car.group.rotation.y = THREE.MathUtils.damp(
            car.group.rotation.y,
            -0.3 + Math.sin(elapsed * 0.18) * 0.17,
            2,
            dt,
          );
        }
        if (scanning) {
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster
            .intersectObject(car.group, true)
            .find(
              (h) =>
                h.object instanceof THREE.Mesh &&
                h.object.material !== scanMaterial,
            );
          if (hit) scan.point.value.lerp(hit.point, 0.15);
          else scan.point.value.set(Math.sin(elapsed * 0.55) * 2, 0.75, 0);
        }
        scan.strength.value = THREE.MathUtils.damp(
          scan.strength.value,
          scanning ? 1 : 0,
          8,
          dt,
        );
        for (const wire of car.wires) wire.visible = scan.strength.value > 0.01;
      }
      controls.update();
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(render);
  }
  function move(e: PointerEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
  }
  function pointerLeave() {
    pointer.set(2, 2);
  }
  const start = () => {
    dragging = true;
    lastInteraction = elapsed;
  };
  const end = () => {
    dragging = false;
    lastInteraction = elapsed;
  };
  controls.addEventListener("start", start);
  controls.addEventListener("end", end);
  renderer.domElement.addEventListener("pointermove", move, { passive: true });
  renderer.domElement.addEventListener("pointerleave", pointerLeave);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersection = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    previous = 0;
  });
  intersection.observe(host);
  resize();
  frame = requestAnimationFrame(render);
  return {
    load,
    scan(value: boolean) {
      scanning = value;
    },
    motion(value: boolean) {
      moving = value;
    },
    rotate(delta: number) {
      if (current) current.group.rotation.y += delta;
      lastInteraction = elapsed;
    },
    replay() {
      if (current) {
        current.entrance = !reduced.matches;
        current.born = elapsed;
        host.dataset.phase = reduced.matches ? "ready" : "assembling";
      }
    },
    dispose() {
      disposed = true;
      request++;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      controls.dispose();
      if (current) {
        disposeObject(current.group);
        disposeObject(current.particles);
      }
      if (outgoing) {
        disposeObject(outgoing.group);
        disposeObject(outgoing.particles);
      }
      scanMaterial.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      shadowTexture.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
