export const hexToRgbaArray = (hex: string): number[] => {
    const norm = hex.replace('#', '');
    const full = norm.length === 6 ? norm + 'FF' : norm;

    return [
        parseInt(full.slice(0, 2), 16) / 255,
        parseInt(full.slice(2, 4), 16) / 255,
        parseInt(full.slice(4, 6), 16) / 255,
        parseInt(full.slice(6, 8), 16) / 255,
    ];
};
