import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { assetUrl } from "./assets";
export type VehicleEngine = ReturnType<typeof createVehicleEngine>;
export function createVehicleEngine(
  host: HTMLElement,
  hero: boolean,
  status: (s: "loading" | "ready" | "error") => void,
) {
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, innerWidth < 700 ? 1 : 1.25),
  );
  renderer.setClearColor(0x0b0e13, hero ? 0 : 1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(30, 1, 0.05, 100);
  const pmrem = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 64 });
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.7;
  scene.add(new T.HemisphereLight(0xe8efff, 0x17202b, 1.2));
  const key = new T.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new T.DirectionalLight(0xc7d8ef, 1.8);
  rim.position.set(-4, 3, -4);
  scene.add(rim);
  const fade = { value: 1 },
    lens = { value: 0 },
    point = { value: new T.Vector3(0, 0.8, 0) },
    loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let model: T.Group | null = null,
    particles: T.Points<T.BufferGeometry, T.ShaderMaterial> | null = null;
  let disposed = false,
    visible = true,
    frame = 0,
    previous = 0,
    born = 0,
    intro = false,
    ready = false,
    hover = false,
    request = 0,
    frames = 0,
    settled = false,
    dirty = true,
    lastPointer = -100,
    pointerPending = false;
  let pickMeshes: T.Mesh[] = [];
  const targetPoint = new T.Vector3(0, 0.8, 0);
  const pointer = new T.Vector2(2, 2),
    ray = new T.Raycaster(),
    hit = new T.Vector3(),
    bounds = new T.Box3();
  function release(root: T.Object3D | null) {
    if (!root) return;
    const geo = new Set<T.BufferGeometry>(),
      mats = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    root.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.Points) {
        geo.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          mats.add(m);
          for (const v of Object.values(m))
            if (v instanceof T.Texture) textures.add(v);
        }
      }
    });
    geo.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    root.removeFromParent();
  }
  function surface(original: T.Material) {
    const s = original as T.MeshStandardMaterial;
    const m = new T.MeshStandardMaterial({
      name: original.name,
      color: s.color ?? 0xbac3ce,
      map: s.map ?? null,
      normalMap: s.normalMap ?? null,
      roughness: Math.max(0.24, s.roughness ?? 0.5),
      metalness: Math.min(0.8, s.metalness ?? 0.2),
      opacity: original.opacity,
      transparent: original.transparent,
      side: original.side,
      emissive: s.emissive ?? 0x000000,
      emissiveMap: s.emissiveMap ?? null,
      alphaTest: original.alphaTest,
      vertexColors: original.vertexColors,
    });
    if (/paint/i.test(m.name)) {
      m.color.set("#9ea9b7");
      m.metalness = 0.65;
      m.roughness = 0.34;
    }
    if (/glass/i.test(m.name)) {
      m.color.set("#576474");
      m.roughness = 0.18;
    }
    if (m.name === "Scene_-_Root") {
      m.color.set("#657384");
      m.metalness = 0.4;
    }
    m.forceSinglePass = true;
    // Cut only the outer shell, preserving the actual engine, seats and chassis.
    const shell =
      /paint|glass|mirror|mblogo|headlight|foglight|signal|vehiclelights|taillight|runninglight|sw222_main_alt/i.test(
        m.name,
      );
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, {
        uBody: fade,
        uLens: lens,
        uPoint: point,
      });
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vCutWorld;",
        )
        .replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nvCutWorld=(modelMatrix*vec4(transformed,1.)).xyz;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vCutWorld;uniform float uBody;uniform float uLens;uniform vec3 uPoint;",
        )
        .replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>\nfloat grain=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(grain>uBody)discard;${shell ? "float opening=(1.-smoothstep(.9,1.18,distance(vCutWorld,uPoint)))*uLens;if(grain<opening)discard;" : ""}`,
        );
    };
    m.userData.outerShell = shell;
    m.customProgramCacheKey = () =>
      shell ? "admiral-open-shell" : "admiral-solid-interior";
    return m;
  }
  function normalize(root: T.Group, file: string) {
    root.updateMatrixWorld(true);
    const whole = new T.Box3().setFromObject(root),
      span = Math.max(whole.max.x - whole.min.x, whole.max.z - whole.min.z),
      backdrops: T.Object3D[] = [];
    root.traverse((o) => {
      if (o instanceof T.Mesh) {
        const s = new T.Box3().setFromObject(o).getSize(new T.Vector3());
        if (s.y < span * 0.001 && s.x > span * 0.4 && s.z > span * 0.4)
          backdrops.push(o);
      }
    });
    backdrops.forEach((o) => o.removeFromParent());
    let box = new T.Box3().setFromObject(root),
      size = box.getSize(new T.Vector3());
    if (size.z > size.x) root.rotation.y = Math.PI / 2;
    root.updateMatrixWorld(true);
    box = new T.Box3().setFromObject(root);
    size = box.getSize(new T.Vector3());
    const center = box.getCenter(new T.Vector3()),
      scale = 5 / Math.max(size.x, size.z);
    root.scale.multiplyScalar(scale);
    root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    const group = new T.Group();
    group.add(root);
    group.rotation.y = -0.3;
    if (!hero && /c180|s63-coupe|amg-gt/.test(file))
      group.rotation.y += Math.PI;
    const cache = new Map<T.Material, T.Material>();
    root.traverse((o) => {
      if (o instanceof T.Mesh) {
        const map = (m: T.Material) => {
          if (!cache.has(m)) cache.set(m, surface(m));
          return cache.get(m)!;
        };
        o.material = Array.isArray(o.material)
          ? o.material.map(map)
          : map(o.material);
      }
    });
    return group;
  }
  function seedParticles() {
    if (!model || !intro) return;
    model.updateMatrixWorld(true);
    const meshes: T.Mesh[] = [];
    model.traverse((o) => {
      if (o instanceof T.Mesh) meshes.push(o);
    });
    const counts = meshes.map((m) => m.geometry.getAttribute("position").count),
      total = counts.reduce((a, b) => a + b, 0),
      count = innerWidth < 700 ? 1200 : 2400,
      target = new Float32Array(count * 3),
      start = new Float32Array(count * 3),
      seeds = new Float32Array(count),
      v = new T.Vector3();
    for (let i = 0; i < count; i++) {
      let pick = Math.floor(Math.random() * total),
        j = 0;
      while (pick >= counts[j]) pick -= counts[j++];
      v.fromBufferAttribute(meshes[j].geometry.getAttribute("position"), pick)
        .applyMatrix4(meshes[j].matrixWorld)
        .toArray(target, i * 3);
      v.set((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize()
        .multiplyScalar(7 + Math.random() * 4)
        .add(camera.position)
        .toArray(start, i * 3);
      seeds[i] = Math.random();
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(target, 3));
    geo.setAttribute("aStart", new T.BufferAttribute(start, 3));
    geo.setAttribute("aSeed", new T.BufferAttribute(seeds, 1));
    const mat = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uFade: { value: 1 },
        uDpr: { value: renderer.getPixelRatio() },
      },
      vertexShader:
        "attribute vec3 aStart;attribute float aSeed;uniform float uProgress;uniform float uDpr;void main(){float t=smoothstep(aSeed*.12,1.,uProgress);vec3 p=mix(aStart,position,t);p.y+=sin(t*3.14159)*(1.-t)*sin(aSeed*30.)*.5;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);gl_PointSize=uDpr*(1.4+aSeed*1.4);}",
      fragmentShader:
        "uniform float uFade;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.75,.85,1.,uFade*(1.-smoothstep(.12,.5,d)));}",
    });
    particles = new T.Points(geo, mat);
    particles.frustumCulled = false;
    scene.add(particles);
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const height = model
        ? new T.Box3().setFromObject(model).getSize(new T.Vector3()).y
        : 1.6,
      portrait = hero && camera.aspect < 0.75;
    camera.fov = hero
      ? portrait
        ? 38
        : w < 900
          ? 33
          : 30
      : height > 2.1
        ? 25
        : 22;
    if (portrait) camera.position.set(8.8, 4.4, 8.8);
    else
      camera.position.set(
        hero ? (w < 900 ? 6.8 : 5.4) : 6.2,
        hero ? 2.6 : 2.2,
        hero ? (w < 900 ? 6.8 : 5.4) : 6.2,
      );
    camera.lookAt(0, hero ? 0.85 : Math.max(0.8, height * 0.43), 0);
    camera.setViewOffset(w, h, 0, hero ? h * 0.06 : 0, w, h);
    camera.updateProjectionMatrix();
    dirty = true;
    wake();
  }
  async function load(file: string, entrance = false) {
    const token = ++request;
    status("loading");
    ready = false;
    hover = false;
    lens.value = 0;
    try {
      const gltf = await loader.loadAsync(assetUrl("models/" + file));
      if (disposed || token !== request) {
        release(gltf.scene);
        return;
      }
      release(model);
      release(particles);
      particles = null;
      model = normalize(gltf.scene, file);
      scene.add(model);
      pickMeshes = [];
      model.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          (Array.isArray(o.material) ? o.material : [o.material]).some(
            (m) => m.userData.outerShell,
          )
        )
          pickMeshes.push(o);
      });
      intro = entrance && !reduced.matches;
      fade.value = intro ? 0 : 1;
      resize();
      seedParticles();
      await renderer.compileAsync(scene, camera);
      if (disposed || token !== request) return;
      born = performance.now();
      settled = false;
      ready = true;
      host.dataset.model = file;
      host.dataset.phase = intro ? "assembling" : "ready";
      status("ready");
      dirty = true;
      wake();
    } catch {
      if (!disposed && token === request) status("error");
    }
  }
  function render(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    if (previous && now - previous < 1000 / 24) {
      frame = requestAnimationFrame(render);
      return;
    }
    const dt = previous ? Math.min((now - previous) / 1000, 0.15) : 1 / 24;
    previous = now;
    const age = (now - born) / 1000;
    if (ready && model) {
      if (intro && !settled) {
        const p = T.MathUtils.clamp(age / 3.1, 0, 1);
        fade.value = T.MathUtils.smoothstep(age, 2.1, 3.6);
        if (particles) {
          particles.material.uniforms.uProgress.value = p;
          particles.material.uniforms.uFade.value = 1 - fade.value;
        }
        if (age >= 3.6) {
          settled = true;
          release(particles);
          particles = null;
          host.dataset.phase = "ready";
        }
        dirty = true;
      }
      if (pointerPending) {
        model.updateMatrixWorld(true);
        bounds.setFromObject(model);
        ray.setFromCamera(pointer, camera);
        const broadHit = ray.ray.intersectBox(bounds, hit);
        const shellHit = broadHit
          ? ray.intersectObjects(pickMeshes, false)[0]
          : null;
        const intersects = shellHit?.point ?? null;
        hover = !!intersects;
        if (intersects) targetPoint.copy(intersects);
        pointerPending = false;
        dirty = true;
      }
      if (point.value.distanceToSquared(targetPoint) > 0.000004) {
        point.value.lerp(targetPoint, 1 - Math.exp(-dt * 18));
        dirty = true;
      }
      const target = hover ? 1 : 0;
      if (Math.abs(lens.value - target) > 0.002) {
        lens.value = T.MathUtils.damp(lens.value, target, 12, dt);
        dirty = true;
      } else lens.value = target;
      host.dataset.cutaway = hover ? "open" : "closed";
    }
    if (dirty) {
      renderer.render(scene, camera);
      host.dataset.frames = String(++frames);
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.triangles = String(renderer.info.render.triangles);
      dirty = false;
    }
    if (
      (intro && !settled && ready) ||
      Math.abs(lens.value - (hover ? 1 : 0)) > 0.002 ||
      pointerPending ||
      point.value.distanceToSquared(targetPoint) > 0.000004
    )
      wake();
    else previous = 0;
  }
  function wake() {
    if (!disposed && visible && !document.hidden && !frame)
      frame = requestAnimationFrame(render);
  }
  function move(e: PointerEvent) {
    if (
      !hero ||
      !ready ||
      e.pointerType === "touch" ||
      performance.now() - lastPointer < 40
    )
      return;
    lastPointer = performance.now();
    const r = host.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    pointerPending = true;
    wake();
  }
  function leave() {
    hover = false;
    pointerPending = false;
    wake();
  }
  function tap(e: PointerEvent) {
    if (e.pointerType !== "touch" || !ready || !model) return;
    const r = host.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const intersection = ray.intersectObjects(pickMeshes, false)[0];
    if (intersection) {
      targetPoint.copy(intersection.point);
      hover = !hover;
    } else hover = false;
    wake();
  }
  function keyboard(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      hover = !hover;
      targetPoint.set(0, 0.85, 0);
      wake();
    }
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    } else {
      dirty = true;
      wake();
    }
  }
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  host.addEventListener("pointerdown", tap);
  host.addEventListener("keydown", keyboard);
  document.addEventListener("visibilitychange", visibility);
  const sizes = new ResizeObserver(resize);
  sizes.observe(host);
  const observer = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    } else {
      dirty = true;
      wake();
    }
  });
  observer.observe(host);
  resize();
  return {
    load,
    dispose() {
      disposed = true;
      request++;
      cancelAnimationFrame(frame);
      sizes.disconnect();
      observer.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointerdown", tap);
      host.removeEventListener("keydown", keyboard);
      document.removeEventListener("visibilitychange", visibility);
      release(model);
      release(particles);
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
