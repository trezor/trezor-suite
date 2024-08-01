const rgbToHexColor = (rgbColor: string) => {
    const [r, g, b] = rgbColor.split('-').map(Number);
    const hex = [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

    return '#' + hex;
};

export const getDominantColor = (imageData: ImageData) => {
    const colorMap: { [key: string]: number } = {};
    const numberOfPixelValues = 4;
    let dominantKey = '';
    let maxCount = 0;

    if (!imageData || imageData.data.length === 0) return undefined;

    for (let i = 0; i < imageData.data.length; i += numberOfPixelValues) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];
        const alpha = imageData.data[i + 3];

        if (alpha !== 255) {
            continue; // ignore pixel with transparency
        }

        const imagePixelKey = `${red}-${green}-${blue}`;
        colorMap[imagePixelKey] = (colorMap[imagePixelKey] || 0) + 1;

        if (colorMap[imagePixelKey] > maxCount) {
            dominantKey = imagePixelKey;
            maxCount = colorMap[imagePixelKey];
        }
    }

    return rgbToHexColor(dominantKey);
};
