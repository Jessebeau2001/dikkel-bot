import { Rect } from '@/lib/jimp-helper';

interface Image {
    pixelate(options: number | {
        size: number;
        x?: number | undefined;
        y?: number | undefined;
        w?: number | undefined;
        h?: number | undefined;
    }) : unknown,
    width: number,
    height: number
}

type Insets = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

function calcDensity(image: { width: number, height: number }): number {
    const base = Math.sqrt(image.width * image.height);
    return base / 25;
}

function expandedRect(rect: Rect, expansion: number | Insets): Rect {
    if (typeof expansion === 'number') {
        return {
            x: rect.x - expansion,
            y: rect.y - expansion,
            width: rect.width + expansion * 2,
            height: rect.height + expansion * 2
        };
    } else {
        const { left, top, right, bottom } = expansion;
        return {
            x: rect.x - left,
            y: rect.y - top,
            width: rect.width + left + right,
            height: rect.height + top + bottom,
        };
    }
}

function estimateExpansion(
    rect: Rect,
    image: { width: number; height: number },
    factor = 0.2
): Insets {
  // scale expansion proportionally to face rect size
  const expX = rect.width * factor;
  const expY = rect.height * factor;

  const left = Math.min(expX, rect.x);
  const top = Math.min(expY, rect.y);
  const right = Math.min(expX, image.width - (rect.x + rect.width));
  const bottom = Math.min(expY, image.height - (rect.y + rect.height));

  return { left, top, right, bottom };
}

// Stupid helper method
export async function pixelateRect(
    image: Image,
    rect: Rect | Rect[],
    density?: number,
): Promise<void> {
    const areas = Array.isArray(rect) ? rect : [ rect ];
    const size = density ?? calcDensity(image);

    for (const area of areas) {
        const expansion = estimateExpansion(area, image);
        const expanded = expandedRect(area, expansion);
        const { x, y, width, height } = expanded;

        console.log('pixelation', expanded);
        await image.pixelate({
            size,
            x,
            y,
            w: width,
            h: height
        });
    }
}
