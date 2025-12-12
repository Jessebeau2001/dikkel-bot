import { JimpImage, RectBounds } from '@/service/jimp-helper';

export function drawEllipseOutline(
  img: JimpImage,
  bounds: RectBounds,
  color: number = 0xffffffff,
  thickness: number = 1
): void {
  const [x1, y1, x2, y2] = bounds;

  const w = x2 - x1;
  const h = y2 - y1;

  const rx = w / 2;
  const ry = h / 2;

  const cx = x1 + rx;
  const cy = y1 + ry;

  const rx2 = rx * rx;
  const ry2 = ry * ry;

  // Thickness defined as inner ellipse
  const rxInner = rx - thickness;
  const ryInner = ry - thickness;

  const rxInner2 = rxInner * rxInner;
  const ryInner2 = ryInner * ryInner;

  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const dx = x - cx;
      const dy = y - cy;

      // ellipse equation: (x^2 / rx^2) + (y^2 / ry^2)
      const outerNorm = (dx * dx) / rx2 + (dy * dy) / ry2;
      const innerNorm = (dx * dx) / rxInner2 + (dy * dy) / ryInner2;

      // outline is between inner and outer ellipse
      if (outerNorm <= 1 && innerNorm >= 1) {
        if (
          x >= 0 &&
          y >= 0 &&
          x < img.bitmap.width &&
          y < img.bitmap.height
        ) {
          const idx = img.getPixelIndex(x, y);
          img.bitmap.data.writeUInt32BE(color, idx);
        }
      }
    }
  }
}
