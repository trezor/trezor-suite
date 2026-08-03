import { isCryptoIconSymbol, isNetworkIconSymbol } from '@suite-common/icons';
import {
    getCoingeckoId,
    getNetworkOptional,
    isNetworkSymbol,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';

import { NativeTokenIcon } from './NativeTokenIcon';
import { NonNativeTokenIcon } from './NonNativeTokenIcon';
import { type TokenIconProps } from './tokenIconTypes';
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
    if (wrappedTokenIcon === 'network' && isWrappedNativeToken(symbol, contractAddress)) {
        contractAddress = null;
    }

    if (!contractAddress) {
        if (showNetworkIcon) {
            const network = getNetworkOptional(symbol);
            const networkSymbol = network?.settlementLayer ?? symbol;
            const displaySymbol = networkSymbol !== symbol ? networkSymbol : symbol;
            const tokenIcon = (
                <NativeTokenIcon symbol={displaySymbol} size={size} data-testid={dataTestId} />
            );

            if (
                (networkSymbol !== symbol || wrappedTokenIcon === 'network') &&
                isNetworkIconSymbol(symbol)
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

    const coingeckoId = isNetworkSymbol(symbol) ? getCoingeckoId(symbol) : undefined;

    if (!coingeckoId) {
        if (isCryptoIconSymbol(symbol)) {
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
