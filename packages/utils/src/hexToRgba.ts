export function hexToRgba(
    hex: string,
    alpha?: number,
): `rgba(${number}, ${number}, ${number}, ${number})` | `rgb(${number}, ${number}, ${number})` {
    const norm = hex.replace('#', '');
    const r = parseInt(norm.slice(0, 2), 16);
    const g = parseInt(norm.slice(2, 4), 16);
    const b = parseInt(norm.slice(4, 6), 16);
    const embeddedAlpha = norm.length === 8 ? parseInt(norm.slice(6, 8), 16) / 255 : undefined;

    if (alpha !== undefined && alpha > 0) {
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (embeddedAlpha !== undefined && embeddedAlpha < 1) {
        const formattedAlpha = Math.round(embeddedAlpha * 100) / 100;

        return `rgba(${r}, ${g}, ${b}, ${formattedAlpha})`;
    }

    return `rgb(${r}, ${g}, ${b})`;
}
