import { useEffect, useState } from 'react';
import {
    AssetShareIndicator,
    AssetShareIndicatorProps,
} from '../AssetShareIndicator/AssetShareIndicator';

export const UPDATED_ICONS_LIST_URL_BASE = 'https://data.trezor.io/suite/icons/coins/';

const QUALITY = {
    normal: '',
    big: '@2x',
};

const QUALITY_SIZE = {
    normal: 24,
    big: 48,
};

type Quality = keyof typeof QUALITY;

const ICON_FILETYPE = '.webp';

type AssetIconProps = AssetShareIndicatorProps & {
    coingeckoId?: string;
    contractAddress?: string;
    quality?: Quality;
};

const getAssetUrl = (coingeckoId: string, contractAddress: string, quality: Quality) => {
    const fileName = contractAddress ? `${coingeckoId}_${contractAddress}` : coingeckoId;

    return fileName
        ? `${UPDATED_ICONS_LIST_URL_BASE}${fileName}${QUALITY[quality]}${ICON_FILETYPE}`
        : '';
};

const useCheckUrlAccessibility = (url: string) => {
    const [isAccessible, setIsAccessible] = useState(false);

    useEffect(() => {
        const checkAccessibility = async () => {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                setIsAccessible(response.ok);
            } catch (error) {
                console.error('Error checking URL accessibility:', error);
                setIsAccessible(false);
            }
        };

        if (url) {
            checkAccessibility();
        }
    }, [url]);

    return isAccessible;
};

export const AssetIcon = ({
    coingeckoId = '',
    contractAddress,
    quality = 'normal',
    ...rest
}: AssetIconProps) => {
    const fileName = contractAddress ? `${coingeckoId}_${contractAddress}` : coingeckoId;
    const assetUrl = getAssetUrl(coingeckoId, contractAddress || '', quality);
    const isAssetUrlAccessible = useCheckUrlAccessibility(assetUrl);
    const iconUrl = fileName && isAssetUrlAccessible ? assetUrl : undefined;
    const firstCharacter = coingeckoId && coingeckoId[0];

    return (
        <AssetShareIndicator
            iconUrl={iconUrl}
            size={QUALITY_SIZE[quality]}
            firstCharacter={firstCharacter}
            {...rest}
        />
    );
};
