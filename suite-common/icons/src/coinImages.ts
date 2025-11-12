export const ICONS_URL_BASE = 'https://data.trezor.io/suite/icons/coins';

export const COIN_IMAGE_SIZES = [24, 40] as const satisfies number[];
export const COIN_IMAGE_QUALITIES = ['1x', '2x'] as const satisfies string[];

export type CoinImageSize = (typeof COIN_IMAGE_SIZES)[number];
export type CoinImageQuality = (typeof COIN_IMAGE_QUALITIES)[number];

export function createCoinImageName<
    Name extends string,
    Size extends CoinImageSize,
    Quality extends CoinImageQuality,
>(name: Name, { size, quality }: { size: Size; quality: Quality }) {
    const qualitySuffix =
        quality !== '1x'
            ? (`@${quality as Exclude<Quality, '1x'>}` as const)
            : ('' as const satisfies string);

    return `${encodeURIComponent(name)}--${size}${qualitySuffix}.webp` as const;
}

export function createCoinImageNameLegacy(name: string, quality: CoinImageQuality) {
    return `${encodeURIComponent(name)}${quality !== '1x' ? `@${quality}` : ''}.webp` as const;
}
