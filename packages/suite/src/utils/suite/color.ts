type RGBChannels = [red: number, green: number, blue: number];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const toHexChannel = (channel: number): string =>
    Math.round(channel * 255)
        .toString(16)
        .padStart(2, '0');

const getHueSector = ([red, green, blue]: RGBChannels, max: number, delta: number): number => {
    if (max === red) {
        return (green - blue) / delta + (green < blue ? 6 : 0);
    }

    if (max === green) {
        return (blue - red) / delta + 2;
    }

    return (red - green) / delta + 4;
};

const getChannelsInHueSector = (
    hueSector: number,
    chroma: number,
    secondComponent: number,
): RGBChannels => {
    if (hueSector < 1) return [chroma, secondComponent, 0];
    if (hueSector < 2) return [secondComponent, chroma, 0];
    if (hueSector < 3) return [0, chroma, secondComponent];
    if (hueSector < 4) return [0, secondComponent, chroma];
    if (hueSector < 5) return [secondComponent, 0, chroma];

    return [chroma, 0, secondComponent];
};

/**
 * Raises the HSL lightness of a `#rrggbb` colour by `amount` (0–1), capped at white, and returns
 * it as `#rrggbb`. Matches `lighten` from polished for every `#rrggbb` input; any other format is
 * returned unchanged.
 */
export const lightenHexColor = (amount: number, hexColor: string): string => {
    if (!HEX_COLOR_PATTERN.test(hexColor)) {
        return hexColor;
    }

    const hexValue = parseInt(hexColor.slice(1), 16);
    const channels: RGBChannels = [
        ((hexValue >> 16) & 0xff) / 255,
        ((hexValue >> 8) & 0xff) / 255,
        (hexValue & 0xff) / 255,
    ];
    const max = Math.max(...channels);
    const min = Math.min(...channels);
    const delta = max - min;
    const lightness = (max + min) / 2;
    const lightenedLightness = Math.min(1, Math.max(0, lightness + amount));

    if (delta === 0) {
        return `#${toHexChannel(lightenedLightness).repeat(3)}`;
    }

    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    // The detour through degrees repeats polished's float rounding, so no channel ends up one step off.
    const hue = getHueSector(channels, max, delta) * 60;
    const hueSector = (((hue % 360) + 360) % 360) / 60;
    const chroma = (1 - Math.abs(2 * lightenedLightness - 1)) * saturation;
    const secondComponent = chroma * (1 - Math.abs((hueSector % 2) - 1));
    const lightnessOffset = lightenedLightness - chroma / 2;

    return `#${getChannelsInHueSector(hueSector, chroma, secondComponent)
        .map(channel => toHexChannel(channel + lightnessOffset))
        .join('')}`;
};
