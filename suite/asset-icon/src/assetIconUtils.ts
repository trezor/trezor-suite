import { type DefaultTheme } from 'styled-components';

import { type NetworkBadgeData } from '@suite-common/networks';
import { getAssetLogoUrl } from '@trezor/asset-utils';

export const getIconUrl = (source: string | number | undefined): string | undefined =>
    typeof source === 'string' ? source : undefined;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const getNetworkBadgeProps = (badge: NetworkBadgeData, theme: DefaultTheme) => ({
    src: getIconUrl(badge.src) ?? '',
    color: badge.testnet ? theme.contentOnDarkPrimary : theme.contentPrimaryInverse,
    backgroundColor: badge.testnet ? theme.elementFillCriticalBold : theme.elementFillContrast,
});

export const getTokenIconSources = (
    coingeckoId: string,
    addresses: readonly string[] = [],
    size: number,
    customLogoUrl?: string,
) => {
    const candidates = [...new Set(addresses.filter(Boolean))].sort();
    const hasNative = candidates.length === 0 || candidates.includes(ZERO_ADDRESS);
    const contracts = hasNative ? [undefined] : [...candidates, undefined];
    const sources = contracts.map(contractAddress => {
        const src = getAssetLogoUrl({ coingeckoId, contractAddress, size, density: 1 });
        const retina = getAssetLogoUrl({ coingeckoId, contractAddress, size, density: 2 });

        return { src, srcSet: `${src} 1x, ${retina} 2x` };
    });

    return customLogoUrl ? [{ src: customLogoUrl, srcSet: customLogoUrl }, ...sources] : sources;
};
