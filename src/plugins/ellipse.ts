import { JimpImage, Rect } from '@/lib/jimp-helper';

export function drawEllipse(
  img: JimpImage,
  size: Rect,
  color: number = 0xffffffff,
  weight: number = 1
): void {
  // Calc from rect
  const x1 = size.x;
  const y1 = size.y;
  
  const w = size.width;
  const h = size.height;

  const x2 = x1 + w;
  const y2 = y1 + h;

  // Circle properties
  const rx = w / 2;
  const ry = h / 2;

  const cx = x1 + rx;
  const cy = y1 + ry;

  const rx2 = rx * rx;
  const ry2 = ry * ry;

  // Thickness defined as inner ellipse
  const rxInner = rx - weight;
  const ryInner = ry - weight;

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

export function drawEllipses(
	image: JimpImage,
	area: Rect | Rect[],
	color: number = 0xFF0000FF,
	weight: number | undefined = undefined
) {
	const rects = Array.isArray(area) ? area : [ area ];
	const stroke = weight ?? Math.min(image.height, image.width) / 200;

	for (const rect of rects) {
		drawEllipse(
			image,
			rect,
			color,
			stroke
		);
	}
}