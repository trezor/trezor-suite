// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
    COIN_IMAGE_SIZES,
    type CoinImageSize,
    ICONS_URL_BASE,
    createCoinImageName,
} from '@suite-common/icons/src/index';

export interface GetAssetLogoUrlParams {
    coingeckoId: string;
    contractAddress?: string;
    /**
     * Pixel density of the image
     */
    density?: 1 | 2;
    size?: number;
}

function resolveImageSize(
    size: GetAssetLogoUrlParams['size'] = 24,
    density: GetAssetLogoUrlParams['density'] = 1,
) {
    const targetSize = size * density;

    return (
        COIN_IMAGE_SIZES.find(s => s >= targetSize) ??
        (Math.max(...COIN_IMAGE_SIZES) as CoinImageSize)
    );
}

export const getAssetLogoUrl = ({
    coingeckoId,
    contractAddress,
    density,
    size,
}: GetAssetLogoUrlParams) => {
    const resolvedSize = resolveImageSize(size, density);
    const fileName = createCoinImageName({ coingeckoId, contractAddress, size: resolvedSize });

    return `${ICONS_URL_BASE}/${fileName}` as const;
};
