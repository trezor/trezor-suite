import { useEffect, useState } from 'react';
import {
    AssetShareIndicator,
    AssetShareIndicatorProps,
} from '../AssetShareIndicator/AssetShareIndicator';
import { useTheme } from 'styled-components';

export const UPDATED_ICONS_LIST_URL_BASE = 'https://data.trezor.io/suite/icons/coins/';

const QUALITY = {
    small: '',
    big: '@2x',
};

const QUALITY_SIZE = {
    small: 24,
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

const useAvatarUrl = ({ coingeckoId, quality }: { coingeckoId?: string; quality: Quality }) => {
    const theme = useTheme();

    const defaultCharacter = '?';
    const size = QUALITY_SIZE[quality];
    const firstCharacter = coingeckoId ? coingeckoId[0] : defaultCharacter;
    const fontColor = theme.iconSubdued.replace('#', '');
    const backgroundColor = theme.backgroundSurfaceElevation0.replace('#', '');

    const avatarUrl = `https://ui-avatars.com/api/?size=${encodeURIComponent(size)}&name=${encodeURIComponent(firstCharacter)}&bold=true&font-size=0.75&color=${encodeURIComponent(fontColor)}&background=${encodeURIComponent(backgroundColor)}&rounded=true`;

    return avatarUrl;
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
    quality = 'small',
    ...rest
}: AssetIconProps) => {
    const fileName = contractAddress ? `${coingeckoId}_${contractAddress}` : coingeckoId;
    const avatarUrl = useAvatarUrl({ coingeckoId, quality });
    const assetUrl = getAssetUrl(coingeckoId, contractAddress || '', quality);
    const isAssetUrlAccessible = useCheckUrlAccessibility(assetUrl);
    const iconUrl = fileName && isAssetUrlAccessible ? assetUrl : avatarUrl || '';

    return <AssetShareIndicator iconUrl={iconUrl} size={QUALITY_SIZE[quality]} {...rest} />;
};
