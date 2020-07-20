/* eslint-disable no-bitwise */
/* eslint-disable prefer-spread */ // to be refactored
import * as pako from 'pako';

const T1_WIDTH = 128;
const T1_HEIGHT = 64;

const T2_WIDTH = 144;
const T2_HEIGHT = 144;
const canvasId = 'homescreen-canvas';

const getWidth = (model: number) => {
    if (model === 2) {
        return T2_WIDTH;
    }
    return T1_WIDTH;
};

const getHeight = (model: number) => {
    if (model === 2) {
        return T2_HEIGHT;
    }
    return T1_HEIGHT;
};

const range = (length: number) => {
    return [...Array(length).keys()];
};

const byteArrayToHexString = (byteArray: Uint8Array) => {
    return Array.from(byteArray, byte => {
        return `0${(byte & 0xff).toString(16)}`.slice(-2);
    }).join('');
};

const rightPad = (len: number, val: string) => {
    while (val.length < len) {
        val = `${val}0`;
    }
    return val;
};

const evenPad = (val: string) => {
    if (val.length % 2 === 0) return val;
    return `0${val}`;
};

const chunkString = (size: number, str: string) => {
    const re = new RegExp(`.{1,${size}}`, 'g');
    const result = str.match(re);
    if (!result) return [];
    return result;
};

const getCanvas = () => {
    const canvas = document.getElementById(canvasId);
    if (canvas != null && canvas instanceof HTMLCanvasElement) {
        return canvas;
    }
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvasId;
    newCanvas.style.visibility = 'hidden';
    newCanvas.style.position = 'absolute';
    newCanvas.style.height = '0';
    const { body } = document;
    if (body == null) {
        throw new Error('document.body is null');
    }
    body.appendChild(newCanvas);
    return newCanvas;
};

const removeCanvas = () => {
    const el = document.getElementById(canvasId);
    if (el) {
        el.remove();
    }
};

// assuming max = x = y here
const isOutsideCircle = (max: number, row: number, col: number) => {
    const half = max / 2;
    const dx = col - half;
    const dy = row - half;
    return Math.sqrt(dx ** 2 + dy ** 2) >= half;
};

const toig = (w: number, h: number, imageData: ImageData) => {
    const homescreen = range(h)
        .map(j =>
            range(w / 8)
                .map(i => {
                    const bytestr = range(8)
                        .map(k => (j * w + i * 8 + k) * 4)
                        .map(index => (imageData.data[index] === 0 ? '0' : '1'))
                        .join('');
                    return String.fromCharCode(parseInt(bytestr, 2));
                })
                .join(''),
        )
        .join('');
    const hex = homescreen
        .split('')
        .map(letter => letter.charCodeAt(0))
        .map(charCode => charCode & 0xff)
        .map(charCode => charCode.toString(16))
        .map(chr => (chr.length < 2 ? `0${chr}` : chr))
        .join('');
    return hex;
};

const toif = (w: number, h: number, imageData: ImageData) => {
    // flat does [[1, 2], [3, 4]] -> [1, 2, 3, 4] here
    const pixels = range(h)
        .map(row => {
            return range(w).map(col => {
                const i = row * w + col;
                // draw black outside the visible area for smaller image size
                if (isOutsideCircle(w, row, col)) {
                    return 0;
                }
                const r = imageData.data[4 * i];
                const g = imageData.data[4 * i + 1];
                const b = imageData.data[4 * i + 2];
                return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | ((b & 0xf8) >> 3);
            });
        })
        .flat();

    // Uint16Array -> Uint8Array
    const bytes = pixels
        .map((p: number) => {
            return [Math.floor(p / 256), p % 256];
        })
        .flat();

    const packed = pako.deflateRaw(bytes, {
        level: 9,
        windowBits: 10,
    });

    // TOIf
    let header = '544f4966';
    // width
    header += '9000';
    // height
    header += '9000';
    let length = Number(packed.length).toString(16);
    if (length.length % 2 > 0) {
        length = evenPad(length);
    }
    length = chunkString(2, length).reverse().join('');
    header += rightPad(8, length);

    return header + byteArrayToHexString(packed);
};

export const fileToDataUrl = (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = e => {
            // @ts-ignore
            return resolve(e.target.result);
        };
        reader.onerror = err => {
            reject(err);
        };
        reader.readAsDataURL(file);
    });
};

const dataUrlToImage = (dataUrl: string): Promise<HTMLImageElement> => {
    const image = new Image();
    return new Promise((resolve, reject) => {
        image.onload = () => {
            resolve(image);
        };
        image.onerror = e => {
            reject(e);
        };
        image.src = dataUrl;
    });
};

export const elementToImageData = (element: HTMLImageElement, width: number, height: number) => {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
        throw new Error('2D context is null');
    }
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(element, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    return imageData;
};

export const checkImage = (origImage: HTMLImageElement, model: number) => {
    const height = getHeight(model);
    const width = getWidth(model);
    if (origImage.height !== height) {
        throw new Error('Not a correct height.');
    }
    if (origImage.width !== width) {
        throw new Error('Not a correct width.');
    }

    const imageData = elementToImageData(origImage, width, height);

    if (model === 1) {
        range(imageData.height).forEach((j: number) => {
            range(imageData.width).forEach(i => {
                const index = j * 4 * imageData.width + i * 4;
                const red = imageData.data[index];
                const green = imageData.data[index + 1];
                const blue = imageData.data[index + 2];
                const alpha = imageData.data[index + 3];
                if (alpha !== 255) {
                    throw new Error('Unexpected alpha.');
                }
                let good = false;
                if (red === 0 && green === 0 && blue === 0) {
                    good = true;
                }
                if (red === 255 && green === 255 && blue === 255) {
                    good = true;
                }
                if (!good) {
                    throw new Error(`wrong color combination ${red} ${green} ${blue}.`);
                }
            });
        });
    }
};

export const check = (file: File, model: number) => {
    return fileToDataUrl(file)
        .then((url: string) => dataUrlToImage(url))
        .then(image => checkImage(image, model));
};

export const imageDataToHex = (imageData: ImageData, model: number) => {
    const w = getWidth(model);
    const h = getHeight(model);

    if (model === 2) {
        return toif(w, h, imageData);
    }
    return toig(w, h, imageData);
};

export const isValid = (dataUrl: string) => {
    if (
        !dataUrl ||
        !(dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/png'))
    ) {
        return false;
    }
    return true;
};

export const elementToHomescreen = (
    element: HTMLImageElement,
    model: number,
    customElToDataFn?: typeof elementToImageData | undefined,
) => {
    // customElToDataFn needed for injecting mocked elementToImageData function in jest tests
    const w = getWidth(model);
    const h = getHeight(model);
    const imageData = customElToDataFn
        ? customElToDataFn(element, w, h)
        : elementToImageData(element, w, h);
    const hex = imageDataToHex(imageData, model);
    removeCanvas();
    return hex;
};
