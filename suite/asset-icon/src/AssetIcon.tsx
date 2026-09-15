import { useMemo } from 'react';

import { useTheme } from 'styled-components';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkIconRegistry } from '@suite-common/networks';
import { TokenIcon, type TokenIconProps } from '@trezor/product-components';
import { useAsyncMemo } from '@trezor/react-utils';

import { getIconUrl, getNetworkBadgeProps, getTokenIconSources } from './assetIconUtils';

const EMPTY_SOURCES: [] = [];

export type AssetIconProps = Omit<TokenIconProps, 'src' | 'sources' | 'badge'> & {
    symbol: string;
    contractAddress?: string | null;
    wrappedTokenIcon?: 'token' | 'network';
    showNetworkIcon?: boolean;
    customLogoUrl?: string;
};

export const AssetIcon = ({
    symbol,
    contractAddress,
    wrappedTokenIcon,
    showNetworkIcon,
    customLogoUrl,
    size = 32,
    ...props
}: AssetIconProps) => {
    const { networkIconRegistry } = useServices(selectNetworkIconRegistry);
    const theme = useTheme();
    const data = useAsyncMemo(
        () =>
            networkIconRegistry.getTokenIcon({
                symbol,
                contractAddress,
                wrappedTokenIcon,
                showNetworkIcon,
            }),
        [networkIconRegistry, symbol, contractAddress, wrappedTokenIcon, showNetworkIcon],
    );
    const sources = useMemo(
        () =>
            data?.coingeckoId
                ? getTokenIconSources(data.coingeckoId, data.contractAddresses, size, customLogoUrl)
                : undefined,
        [data, size, customLogoUrl],
    );

    return (
        <TokenIcon
            {...props}
            size={size}
            src={getIconUrl(data?.src)}
            sources={sources ?? (contractAddress && !data ? EMPTY_SOURCES : undefined)}
            badge={data?.badge && getNetworkBadgeProps(data.badge, theme)}
        />
    );
};
