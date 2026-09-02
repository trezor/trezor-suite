// eslint-disable-next-line import/no-extraneous-dependencies
import sharp from 'sharp';

export async function resizeImage(imageBuffer: ArrayBuffer | Buffer, size: number) {
    const resizedImage = sharp(imageBuffer).resize(size, size);

    const fullQualityImageBuffer = await resizedImage.webp({ quality: 100 }).toBuffer();
    const lossLessImageBuffer = await resizedImage.clone().webp({ lossless: true }).toBuffer();

    // sometimes lossless image is much smaller than 100 quality compressed image
    return fullQualityImageBuffer.byteLength < lossLessImageBuffer.byteLength
        ? fullQualityImageBuffer
        : lossLessImageBuffer;
}

// The density at which sharp takes an SVG's intrinsic dimensions literally, i.e. the one it
// rasterizes at when none is given.
const SVG_DEFAULT_DENSITY = 72;

/**
 * Renders an SVG into a webp of the given size.
 *
 * sharp rasterizes a vector at its intrinsic size before applying any resize, which would upscale a
 * 24px design-system icon into a blurry 80px one — hence the density, which makes it rasterize at
 * the target size in the first place.
 */
export async function rasterizeSvg(svgBuffer: Buffer, size: number) {
    const { width } = await sharp(svgBuffer).metadata();
    const density = width ? Math.ceil((SVG_DEFAULT_DENSITY * size) / width) : SVG_DEFAULT_DENSITY;

    const raster = await sharp(svgBuffer, { density }).resize(size, size).png().toBuffer();

    return await resizeImage(raster, size);
}
