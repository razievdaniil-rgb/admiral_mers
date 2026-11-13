import * as T from "three";
// Batch the real internal parts into two lightweight scan layers.
export function createXrayLayers(root: T.Group, material: () => T.Material) {
  root.updateMatrixWorld(true);
  const prepared: T.Mesh[] = [];
  root.traverse((group) => {
    if (!group.userData.scanProxy) return;
    group.traverse((o) => {
      if (o instanceof T.Mesh) {
        const old = Array.isArray(o.material) ? o.material : [o.material];
        old.forEach((m) => m.dispose());
        o.material = material();
        o.renderOrder = 6;
        o.visible = false;
        prepared.push(o);
      }
    });
  });
  if (prepared.length) return prepared;
  const inverse = root.matrixWorld.clone().invert();
  const buckets: [T.Mesh[], T.Mesh[]] = [[], []];
  root.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some((m) => /^Engine|gavril_v8|etk_engine/.test(m.name)))
      buckets[0].push(o);
    else if (
      mats.some((m) =>
        /^Cabin|interior|alcantara|texture28|texture30|texture17|steeringwheel/.test(
          m.name,
        ),
      )
    )
      buckets[1].push(o);
  });
  return buckets
    .filter((parts) => parts.length)
    .map((parts) => {
      const count = parts.reduce(
        (n, m) =>
          n +
          (m.geometry.index?.count ??
            m.geometry.getAttribute("position").count),
        0,
      );
      const positions = new Float32Array(count * 3),
        normals = new Float32Array(count * 3);
      const p = new T.Vector3(),
        n = new T.Vector3();
      let cursor = 0;
      for (const mesh of parts) {
        const g = mesh.geometry,
          pos = g.getAttribute("position"),
          normal = g.getAttribute("normal"),
          transform = inverse.clone().multiply(mesh.matrixWorld),
          nm = new T.Matrix3().getNormalMatrix(transform),
          indices = g.index,
          total = indices?.count ?? pos.count;
        for (let i = 0; i < total; i++) {
          const index = indices ? indices.getX(i) : i;
          p.fromBufferAttribute(pos, index)
            .applyMatrix4(transform)
            .toArray(positions, cursor);
          if (normal)
            n.fromBufferAttribute(normal, index).applyNormalMatrix(nm);
          else n.set(0, 1, 0);
          n.toArray(normals, cursor);
          cursor += 3;
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new T.BufferAttribute(normals, 3));
      geometry.computeBoundingSphere();
      const layer = new T.Mesh(geometry, material());
      layer.renderOrder = 6;
      layer.visible = false;
      root.add(layer);
      return layer;
    });
}
