import { useSelector } from 'react-redux';

import { useServices } from '@trezor/dependency-injection';
import type { NetworkConfigState } from '@trezor/network-module-types';

import { NativeTokenIcon } from './NativeTokenIcon';
import { NonNativeTokenIcon } from './NonNativeTokenIcon';
import { type TokenIconProps } from './tokenIconTypes';
import { ZERO_ADDRESS, hasForeignNativeAsset } from './tokenIconUtils';
import { selectNetworkConfig } from '../../network-display/networkDisplaySelectors';
import { injectHasNetworkIcon, injectIsWrappedNativeToken } from '../../services/networkServices';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

export const TokenIcon = ({
    networkSymbol,
    contractAddress,
    size = 32,
    showNetworkIcon = false,
    shouldTryToFetch = true,
    placeholderWithTooltip = true,
    placeholder = '',
    customLogoUrl,
    isBordered = true,
    isTransparent = false,
    wrappedTokenIcon = 'token',
    'data-testid': dataTestId,
}: TokenIconProps) => {
    const network = useSelector((state: NetworkConfigState) =>
        selectNetworkConfig(state, networkSymbol),
    );
    const { hasNetworkIcon, isWrappedNativeToken } = useServices(
        injectHasNetworkIcon,
        injectIsWrappedNativeToken,
    );
    if (wrappedTokenIcon === 'network' && isWrappedNativeToken(networkSymbol, contractAddress)) {
        contractAddress = null;
    }

    if (!contractAddress && showNetworkIcon && network && hasForeignNativeAsset(network)) {
        contractAddress = ZERO_ADDRESS;
        placeholder = placeholder || network.displaySymbol || '';
    }

    if (!contractAddress) {
        if (showNetworkIcon) {
            const settlementSymbol = network?.settlementLayer ?? networkSymbol;
            const displaySymbol =
                settlementSymbol !== networkSymbol ? settlementSymbol : networkSymbol;
            const tokenIcon = (
                <NativeTokenIcon symbol={displaySymbol} size={size} data-testid={dataTestId} />
            );

            if (
                (settlementSymbol !== networkSymbol || wrappedTokenIcon === 'network') &&
                hasNetworkIcon(networkSymbol)
            ) {
                return (
                    <NetworkIconBadge
                        networkSymbol={networkSymbol}
                        parentSize={size}
                        data-testid={dataTestId}
                    >
                        {tokenIcon}
                    </NetworkIconBadge>
                );
            }

            return tokenIcon;
        }

        return <NativeTokenIcon symbol={networkSymbol} size={size} data-testid={dataTestId} />;
    }

    const coingeckoId = network?.coingeckoId;

    if (!coingeckoId) {
        return <NativeTokenIcon symbol={networkSymbol} size={size} data-testid={dataTestId} />;
    }

    return (
        <NonNativeTokenIcon
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            size={size}
            showNetworkIcon={showNetworkIcon}
            shouldTryToFetch={shouldTryToFetch}
            placeholderWithTooltip={placeholderWithTooltip}
            placeholder={placeholder}
            customLogoUrl={customLogoUrl}
            isBordered={isBordered}
            isTransparent={isTransparent}
            coingeckoId={coingeckoId}
            data-testid={dataTestId}
        />
    );
};
