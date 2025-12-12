import { drawEllipseOutline } from '../plugins/ellipse';
import { Bitmap } from 'jimp';

export type RectBounds = [x1: number, y1: number, x2: number, y2: number];

export type JimpImage = {
    readonly width: number;
    readonly height: number;
    bitmap: Bitmap;
    getPixelIndex: (x: number, y: number) => number;
};

export function applyEllipsesToImage(
	image: JimpImage,
	bounds: RectBounds[],
	color: number = 0xFF0000FF,
	strokeWeight: number | undefined = undefined
) {
	const weight = strokeWeight ?? Math.min(image.height, image.width) / 200;

	for (const bound of bounds) {
		const [ top, right, bottom, left ] = bound;
		drawEllipseOutline(
			image,
			[ left, top, right, bottom ],
			color,
			weight
		);
	}
}

export function calcStrokeWeight(
    imgWidth: number,
    imgHeight: number,
    [ top, right, bottom, left ]: RectBounds,
    baseWeight = 100
) {
    const width = right - left;
    const height = bottom - top;

    const minImgSize = Math.min(imgWidth, imgHeight);
    const minRectSize = Math.min(width, height);
    
    return minRectSize / minImgSize * baseWeight;
}