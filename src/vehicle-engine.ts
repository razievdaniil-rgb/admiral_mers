import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { assetUrl } from "./assets";
import { ASSEMBLY_SECONDS, DRIVE_SECONDS, drivePose } from "./drive-motion";
import { createDriveStage } from "./drive-stage";
import { createXrayLayers } from "./vehicle-xray";
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
  const sweepX = { value: 2.6 },
    sweepStrength = { value: 0 },
    carInverse = { value: new T.Matrix4() };
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
    activeAge = 0,
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
  let wheels: {
    node: T.Object3D;
    base: T.Quaternion;
    axis: T.Vector3;
    radius: number;
  }[] = [];
  let stage: ReturnType<typeof createDriveStage> | null = null;
  let xrayMeshes: T.Mesh[] = [];
  let drive = 0,
    driveTarget = 0,
    manualDrive = false,
    scrollAnchor = 0,
    scrollOrigin = 0,
    scrollPending = false;
  let orbitAngle = 0,
    orbitTarget = 0,
    userOrbit = false;
  let dragPointer: number | null = null,
    dragX = 0,
    dragStartX = 0,
    dragStartY = 0,
    didDrag = false;
  const wheelRotation = new T.Quaternion();
  const story = host.closest(".hero-drive-story") as HTMLElement | null;
  const sticky = host.closest(".fhero") as HTMLElement | null;
  function applyDrive(progress: number, moving = false) {
    if (!model || !hero) return;
    const pose = drivePose(progress);
    model.position.x = pose.x;
    model.rotation.y = pose.yaw + orbitAngle;
    host.dataset.rotation = orbitAngle.toFixed(3);
    for (const wheel of wheels)
      wheel.node.quaternion
        .copy(wheel.base)
        .multiply(
          wheelRotation.setFromAxisAngle(
            wheel.axis,
            pose.travel / wheel.radius,
          ),
        );
    model.updateMatrixWorld(true);
    carInverse.value.copy(model.matrixWorld).invert();
    sweepX.value = pose.scanX;
    sweepStrength.value = reduced.matches ? 0 : pose.scanStrength;
    stage?.update(
      pose.scanX,
      sweepStrength.value,
      pose.travel - (pose.x + 0.48),
      moving,
    );
    host.dataset.drive = progress.toFixed(4);
    host.dataset.wheelRoll = pose.travel.toFixed(3);
    host.dataset.sweep = sweepStrength.value > 0.05 ? "open" : "closed";
  }
  function readScroll() {
    scrollPending = false;
    if (!hero || !story || !sticky || !ready || reduced.matches) return;
    const distance = story.offsetHeight - sticky.offsetHeight;
    if (distance < 2) return;
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    const progress = T.MathUtils.clamp(
      (top - story.getBoundingClientRect().top) / distance,
      0,
      1,
    );
    if (!manualDrive && progress > 0.005) {
      manualDrive = true;
      const completed = activeAge >= ASSEMBLY_SECONDS + DRIVE_SECONDS;
      scrollAnchor = drive;
      scrollOrigin = completed ? 0 : progress;
    }
    if (manualDrive)
      driveTarget = Math.max(0, scrollAnchor + progress - scrollOrigin);
  }
  function onScroll() {
    if (!hero) return;
    scrollPending = true;
    wake();
  }
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
  function surface(original: T.Material, xray = false) {
    const s = original as T.MeshStandardMaterial;
    const m = new T.MeshStandardMaterial({
      name: original.name,
      color: s.color ?? 0xbac3ce,
      map: s.map ?? null,
      normalMap: s.normalMap ?? null,
      roughnessMap: s.roughnessMap ?? null,
      metalnessMap: s.metalnessMap ?? null,
      aoMap: s.aoMap ?? null,
      normalScale: s.normalScale,
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
      m.color.set("#343e4b");
      m.metalness = 0.82;
      m.roughness = 0.33;
      m.normalScale.set(0.12, 0.12);
    }
    if (/glass/i.test(m.name)) {
      m.color.set("#8c9cae");
      if (!/Engine|Cabin/.test(m.name)) {
        m.transparent = true;
        m.opacity = /windshield|shared 50|shared 51/.test(m.name) ? 0.28 : 0.45;
        m.depthWrite = false;
      }
      m.roughness = 0.18;
    }
    if (m.name === "Scene_-_Root") {
      m.color.set("#657384");
      m.metalness = 0.4;
    }
    if (
      /interior|leather|alcantara|texture28|texture30|texture17/.test(m.name)
    ) {
      m.color.set("#303943");
      m.roughness = 0.68;
    }
    m.forceSinglePass = true;
    // Cut only the outer shell, preserving the actual engine, seats and chassis.
    const shell =
      /paint|glass|mirror|mblogo|headlight|foglight|signal|vehiclelights|taillight|runninglight|sw222_main_alt/i.test(
        m.name,
      );
    if (xray) {
      m.transparent = true;
      m.depthWrite = false;
      m.depthTest = false;
    }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, {
        uBody: fade,
        uLens: lens,
        uPoint: point,
        uSweepX: sweepX,
        uSweepStrength: sweepStrength,
        uCarInverse: carInverse,
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
          "#include <common>\nvarying vec3 vCutWorld;uniform float uBody;uniform float uLens;uniform vec3 uPoint;uniform float uSweepX;uniform float uSweepStrength;uniform mat4 uCarInverse;",
        )
        .replace(
          "#include <opaque_fragment>",
          `
          float scanX=(uCarInverse*vec4(vCutWorld,1.)).x;
          float band=(1.-smoothstep(.32,1.05,abs(scanX-uSweepX)))*uSweepStrength;
          float opening=(1.-smoothstep(.45,1.0,distance(vCutWorld,uPoint)))*uLens;
          float scan=max(band,opening);
          float edge=pow(1.-abs(dot(normal,normalize(vViewPosition))),2.);
          ${xray ? "diffuseColor.a = scan*(.12+edge*.34)*uBody; if(diffuseColor.a<.002)discard; outgoingLight=outgoingLight*.55+vec3(.045,.16,.21);" : shell ? "outgoingLight=mix(outgoingLight,vec3(.32,.62,.78)*( .45+edge*.65),scan*.18);" : "outgoingLight=mix(outgoingLight,outgoingLight*.7+vec3(.11,.23,.29),scan*.55);"}
          #include <opaque_fragment>
        `,
        )
        .replace(
          "#include <dithering_fragment>",
          "#include <dithering_fragment>\nif(uBody<.001)discard;gl_FragColor.rgb*=smoothstep(0.,1.,uBody);",
        );
    };
    m.userData.outerShell = shell;
    m.userData.scanPart = /^(Engine|Cabin) \|/.test(m.name);
    m.customProgramCacheKey = () =>
      xray
        ? "admiral-xray-interior"
        : shell
          ? "admiral-lit-shell"
          : "admiral-solid-interior";
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
    root.traverse((node) => {
      if (node.userData.scanProxy)
        node.traverse((child) => {
          if (child instanceof T.Mesh) child.visible = false;
        });
    });
    return group;
  }
  function seedParticles() {
    if (!model || !intro) return;
    model.updateMatrixWorld(true);
    const meshes: T.Mesh[] = [];
    model.traverse((o) => {
      if (o instanceof T.Mesh && o.visible) meshes.push(o);
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
    if (portrait) camera.position.set(11.6, 5.1, 11.6);
    else
      camera.position.set(
        hero ? (w < 900 ? 6.8 : 5.4) : 6.2,
        hero ? 2.05 : 2.2,
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
      stage?.dispose();
      stage = null;
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
      wheels = [];
      model.updateMatrixWorld(true);
      model.traverse((node) => {
        if (node.name.startsWith("Admiral_Wheel_")) {
          const scale = node.getWorldScale(new T.Vector3()).y;
          wheels.push({
            node,
            base: node.quaternion.clone(),
            axis: new T.Vector3().fromArray(
              node.userData.spinAxis ?? [1, 0, 0],
            ),
            radius: Math.max(0.2, (node.userData.spinRadius ?? 0.35) * scale),
          });
        }
      });
      drive = hero && reduced.matches ? 1 : 0;
      driveTarget = drive;
      manualDrive = false;
      applyDrive(drive);
      intro = entrance && !reduced.matches;
      fade.value = intro ? 0 : 1;
      resize();
      seedParticles();
      if (hero)
        xrayMeshes = createXrayLayers(model, () =>
          surface(
            new T.MeshStandardMaterial({
              name: "Xray internal parts",
              color: 0x8599aa,
              roughness: 0.65,
              metalness: 0.15,
            }),
            true,
          ),
        );
      if (hero) {
        stage = createDriveStage(scene, model);
        applyDrive(drive);
      }
      await renderer.compileAsync(scene, camera);
      if (disposed || token !== request) return;
      activeAge = 0;
      previous = 0;
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
    const frameRate = host.clientWidth < 700 ? 30 : 60;
    if (previous && now - previous < 1000 / frameRate - 1) {
      frame = requestAnimationFrame(render);
      return;
    }
    const dt = previous
      ? Math.min((now - previous) / 1000, 0.1)
      : 1 / frameRate;
    previous = now;
    if (ready && dragPointer === null && !userOrbit) activeAge += dt;
    const age = activeAge;
    if (scrollPending) readScroll();
    if (ready && model) {
      if (intro && !settled) {
        const p = T.MathUtils.clamp(age / (ASSEMBLY_SECONDS * 0.92), 0, 1);
        fade.value = T.MathUtils.smoothstep(
          age,
          ASSEMBLY_SECONDS * 0.56,
          ASSEMBLY_SECONDS,
        );
        if (particles) {
          particles.material.uniforms.uProgress.value = p;
          particles.material.uniforms.uFade.value = 1 - fade.value;
        }
        if (age >= ASSEMBLY_SECONDS) {
          settled = true;
          release(particles);
          particles = null;
          host.dataset.phase = "ready";
        }
        dirty = true;
      }
      if (hero) {
        if (!manualDrive && !userOrbit)
          driveTarget = reduced.matches
            ? 1
            : T.MathUtils.clamp((age - ASSEMBLY_SECONDS) / DRIVE_SECONDS, 0, 1);
        const canDrive = !intro || settled;
        const next = canDrive
          ? manualDrive
            ? T.MathUtils.damp(drive, driveTarget, 9, dt)
            : driveTarget
          : 0;
        const changing = Math.abs(next - drive) > 0.00005;
        if (changing) {
          drive = next;
          applyDrive(drive, true);
          dirty = true;
          host.dataset.phase =
            sweepStrength.value > 0.1 ? "scanning" : "driving";
        }
        if (
          canDrive &&
          Math.abs(drive - driveTarget) < 0.00005 &&
          (manualDrive ||
            age >= ASSEMBLY_SECONDS + DRIVE_SECONDS ||
            reduced.matches)
        ) {
          drive = driveTarget;
          applyDrive(drive, false);
          host.dataset.phase = "ready";
        }
      }
      if (Math.abs(orbitAngle - orbitTarget) > 0.0002) {
        orbitAngle = T.MathUtils.damp(orbitAngle, orbitTarget, 14, dt);
        applyDrive(drive);
        dirty = true;
      }
      if (pointerPending && dragPointer === null) {
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
      xrayMeshes.forEach(
        (m) =>
          (m.visible =
            fade.value > 0.98 &&
            (sweepStrength.value > 0.005 || lens.value > 0.005)),
      );
      renderer.render(scene, camera);
      host.dataset.frames = String(++frames);
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.triangles = String(renderer.info.render.triangles);
      dirty = false;
    }
    if (
      (intro && !settled && ready) ||
      (hero &&
        ready &&
        !reduced.matches &&
        ((!manualDrive &&
          !userOrbit &&
          age < ASSEMBLY_SECONDS + DRIVE_SECONDS) ||
          Math.abs(drive - driveTarget) > 0.00005)) ||
      Math.abs(orbitAngle - orbitTarget) > 0.0002 ||
      scrollPending ||
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
    if (dragPointer === e.pointerId) {
      if (
        Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY) >
        4
      )
        didDrag = true;
      orbitTarget += (e.clientX - dragX) * 0.008;
      dragX = e.clientX;
      hover = false;
      pointerPending = false;
      userOrbit = true;
      host.dataset.dragging = "true";
      wake();
      return;
    }
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
    if (dragPointer !== null) return;
    hover = false;
    pointerPending = false;
    wake();
  }
  function tap(e: PointerEvent) {
    if (!ready || !model || (intro && !settled) || e.button !== 0) return;
    const r = host.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const intersection = ray.intersectObjects(pickMeshes, false)[0];
    if (!intersection) return;
    dragPointer = e.pointerId;
    dragX = dragStartX = e.clientX;
    dragStartY = e.clientY;
    didDrag = false;
    targetPoint.copy(intersection.point);
    if (e.pointerType !== "touch") {
      host.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    wake();
  }
  function endDrag(e: PointerEvent) {
    if (dragPointer !== e.pointerId) return;
    dragPointer = null;
    host.dataset.dragging = "false";
    if (host.hasPointerCapture(e.pointerId))
      host.releasePointerCapture(e.pointerId);
    hover = e.pointerType === "touch" && !didDrag ? !hover : false;
    dirty = true;
    wake();
  }
  function keyboard(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (!ready || (intro && !settled)) return;
      e.preventDefault();
      userOrbit = true;
      hover = false;
      orbitTarget += ((e.key === "ArrowLeft" ? -1 : 1) * Math.PI) / 12;
      wake();
      return;
    }
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
  host.addEventListener("pointerup", endDrag);
  host.addEventListener("pointercancel", endDrag);
  host.addEventListener("lostpointercapture", endDrag);
  host.addEventListener("keydown", keyboard);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("scroll", onScroll, { passive: true });
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
      host.removeEventListener("pointerup", endDrag);
      host.removeEventListener("pointercancel", endDrag);
      host.removeEventListener("lostpointercapture", endDrag);
      host.removeEventListener("keydown", keyboard);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("scroll", onScroll);
      stage?.dispose();
      release(model);
      release(particles);
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
