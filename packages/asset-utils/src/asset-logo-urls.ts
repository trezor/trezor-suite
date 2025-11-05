// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
    COIN_IMAGE_SIZES,
    CoinImageQuality,
    CoinImageSize,
    ICONS_URL_BASE,
    createCoinImageName,
} from '@suite-common/icons/src/index';

export interface GetAssetLogoUrlParams {
    coingeckoId: string;
    contractAddress?: string;
    quality?: CoinImageQuality;
    size?: CoinImageSize;
}

export const getAssetLogoUrl = ({
    coingeckoId,
    contractAddress,
    quality = '1x',
    size = 24,
}: GetAssetLogoUrlParams) => {
    const name = contractAddress ? `${coingeckoId}--${contractAddress}` : coingeckoId;
    const fileName = createCoinImageName(name, { size, quality });

    return `${ICONS_URL_BASE}/${fileName}` as const;
};

/**
 * - Coin images are generated only in specific sizes (defined in `COIN_IMAGE_SIZES` constant).
 * - This util. finds the `COIN_IMAGE_SIZES` size that is at least as big as the `size` parameter.
 */
export function resolveAssetLogoSize(size: number, defaultSize: CoinImageSize = 24): CoinImageSize {
    return COIN_IMAGE_SIZES.find(s => s >= size) ?? defaultSize;
}
