import { isCryptoIconSymbol, isNetworkIconSymbol } from '@suite-common/icons';
import {
    getCoingeckoId,
    getNetworkOptional,
    isNetworkSymbol,
    isWrappedNativeToken,
    shouldShowNetworkBadge,
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
    showNativeNetworkBadge = false,
    shouldTryToFetch = true,
    placeholderWithTooltip = true,
    placeholder = '',
    customLogoUrl,
    isBordered = true,
    wrappedTokenIcon = 'token',
    'data-testid': dataTestId,
}: TokenIconProps) => {
    if (wrappedTokenIcon === 'network' && isWrappedNativeToken(symbol, contractAddress)) {
        contractAddress = null;
    }

    if (!contractAddress) {
        if (showNetworkIcon) {
            const networkSymbol = getNetworkOptional(symbol)?.settlementLayer ?? symbol;
            const hasDistinctSettlementLayer = networkSymbol !== symbol;
            const isBadgeableTokenNetwork =
                showNativeNetworkBadge && isNetworkSymbol(symbol) && shouldShowNetworkBadge(symbol);
            const tokenIcon = (
                <NativeTokenIcon symbol={networkSymbol} size={size} data-testid={dataTestId} />
            );

            const showBadge =
                isNetworkIconSymbol(symbol) &&
                (hasDistinctSettlementLayer ||
                    wrappedTokenIcon === 'network' ||
                    isBadgeableTokenNetwork);

            if (showBadge) {
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
            coingeckoId={coingeckoId}
            data-testid={dataTestId}
        />
    );
};
