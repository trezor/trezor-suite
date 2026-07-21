export const ICONS_URL_BASE = 'https://data.trezor.io/suite/icons/coins';

export const COIN_IMAGE_SIZES = [24, 40, 48, 80] as const satisfies number[];

export type CoinImageSize = (typeof COIN_IMAGE_SIZES)[number];

const CRYPTO_ID_SEPARATOR = '--';
export const IMAGE_SIZE_SEPARATOR = '@';
export const IMAGE_EXTENSION = '.webp';

function createCryptoId(coingeckoId: string, contractAddress?: string) {
    const cryptoId = contractAddress
        ? (`${coingeckoId}${CRYPTO_ID_SEPARATOR}${contractAddress}` as const)
        : coingeckoId;

    return encodeURIComponent(cryptoId);
}

export interface CreateCoinImageNameParams<Size extends CoinImageSize> {
    coingeckoId: string;
    contractAddress?: string;
    size: Size;
}

export function createCoinImageName<Size extends CoinImageSize>({
    coingeckoId,
    contractAddress,
    size,
}: CreateCoinImageNameParams<Size>) {
    const cryptoId = createCryptoId(coingeckoId, contractAddress);

    return `${cryptoId}${IMAGE_SIZE_SEPARATOR}${size}${IMAGE_EXTENSION}` as const;
}
