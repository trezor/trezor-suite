const ICONS_URL_BASE = 'https://data.trezor.io/suite/icons/coins/';

const composeAssetLogoUrl = (fileName: string, quality?: '@2x') =>
    `${ICONS_URL_BASE}${fileName}${quality === undefined ? '' : quality}.webp`;

export const getAssetLogoUrl = ({
    coingeckoId,
    contractAddress,
    quality,
}: {
    coingeckoId: string;
    contractAddress?: string;
    quality?: '@2x';
}) =>
    composeAssetLogoUrl(
        contractAddress ? `${coingeckoId}--${contractAddress}` : coingeckoId,
        quality,
    );
