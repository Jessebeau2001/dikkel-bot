import { Bitmap } from 'jimp';

export type Area = [ top: number, right: number, bottom: number, left: number ];

export type Rect = {
    x: number
    y: number
    width: number
    height: number
}

export type JimpImage = {
    readonly width: number;
    readonly height: number;
    bitmap: Bitmap;
    getPixelIndex: (x: number, y: number) => number;
};

export function areaToRect([top, right, bottom, left]: Area): Rect {
	return {
		x: left,
		y: top,
		width: right - left,
		height: bottom - top,
	};
}