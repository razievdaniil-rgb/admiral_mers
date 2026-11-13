export const ASSEMBLY_SECONDS = 3.6;
export const DRIVE_SECONDS = 6;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// The camera follows most of the travel, keeping the whole car inside the hero.
export function drivePose(progress: number) {
  const p = Math.max(0, progress),
    follow = 1 - Math.exp(-p * 0.9),
    scan = p - Math.floor(p);
  return {
    x: -0.48 + follow * 1.25,
    yaw: -0.12 - follow * 0.34,
    travel: p * 6,
    scanX: 2.6 - scan * 5.2,
    scanStrength: smooth(0, 0.1, scan) * (1 - smooth(0.9, 1, scan)),
  };
}
