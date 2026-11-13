export const ASSEMBLY_SECONDS = 2.8;
export const DRIVE_SECONDS = 5;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// The camera follows most of the travel, keeping the whole car inside the hero.
export function drivePose(progress: number) {
  // A single, bounded camera move. Scrolling can continue the scene without
  // restarting the scanner or turning the car into a head-on silhouette.
  const p = Number.isFinite(progress) ? Math.max(0, progress) : 0,
    follow = smooth(0, 1, p),
    continuation = smooth(1, 2, p),
    scan = smooth(0.12, 0.9, p);
  return {
    x: -0.38 + follow * 0.72 + continuation * 0.12,
    yaw: 0.48 - follow * 0.64 - continuation * 0.08,
    travel: follow * 5 + continuation * 1.2,
    scanX: 2.6 - scan * 5.2,
    scanStrength: smooth(0.12, 0.24, p) * (1 - smooth(0.78, 0.9, p)),
  };
}
