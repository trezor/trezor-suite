import { useSelector } from 'react-redux';

import { useServices } from '@trezor/dependency-injection';
import type { NetworkConfigState } from '@trezor/network-module-types';

import { NativeTokenIcon } from './NativeTokenIcon';
import { NonNativeTokenIcon } from './NonNativeTokenIcon';
import { type TokenIconProps } from './tokenIconTypes';
import { selectNetworkConfig } from '../../network-display/networkDisplaySelectors';
import {
    injectHasCryptoIcon,
    injectHasNetworkIcon,
    injectIsWrappedNativeToken,
} from '../../services/networkServices';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

export const TokenIcon = ({
    symbol,
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
    const network = useSelector((state: NetworkConfigState) => selectNetworkConfig(state, symbol));
    const { hasCryptoIcon, hasNetworkIcon, isWrappedNativeToken } = useServices(
        injectHasCryptoIcon,
        injectHasNetworkIcon,
        injectIsWrappedNativeToken,
    );
    if (wrappedTokenIcon === 'network' && isWrappedNativeToken(symbol, contractAddress)) {
        contractAddress = null;
    }

    if (!contractAddress) {
        if (showNetworkIcon) {
            const networkSymbol = network?.settlementLayer ?? symbol;
            const displaySymbol = networkSymbol !== symbol ? networkSymbol : symbol;
            const tokenIcon = (
                <NativeTokenIcon symbol={displaySymbol} size={size} data-testid={dataTestId} />
            );

            if (
                (networkSymbol !== symbol || wrappedTokenIcon === 'network') &&
                hasNetworkIcon(symbol)
            ) {
                return (
                    <NetworkIconBadge
                        networkSymbol={symbol}
                        parentSize={size}
                        data-testid={dataTestId}
                    >
                        {tokenIcon}
                    </NetworkIconBadge>
                );
            }

            return tokenIcon;
        }

        return <NativeTokenIcon symbol={symbol} size={size} data-testid={dataTestId} />;
    }

    const coingeckoId = network?.coingeckoId;

    if (!coingeckoId) {
        if (hasCryptoIcon(symbol)) {
            return <NativeTokenIcon symbol={symbol} size={size} data-testid={dataTestId} />;
        }

        return null;
    }

    return (
        <NonNativeTokenIcon
            symbol={symbol}
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
