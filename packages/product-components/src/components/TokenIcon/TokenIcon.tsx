import { isCryptoIconSymbol } from '@suite-common/icons';
import { getCoingeckoId, isNetworkSymbol, isWrappedNativeToken } from '@suite-common/wallet-config';

import { NativeCoinIcon } from './NativeCoinIcon';
import { NativeTokenIcon } from './NativeTokenIcon';
import { NonNativeTokenIcon } from './NonNativeTokenIcon';
import { type TokenIconProps } from './tokenIconTypes';

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
    isTransparent = false,
    wrappedTokenIcon = 'token',
    'data-testid': dataTestId,
}: TokenIconProps) => {
    if (wrappedTokenIcon === 'network' && isWrappedNativeToken(symbol, contractAddress)) {
        contractAddress = null;
    }

    if (!contractAddress) {
        return (
            <NativeCoinIcon
                symbol={symbol}
                size={size}
                showNetworkIcon={showNetworkIcon}
                showNativeNetworkBadge={showNativeNetworkBadge}
                wrappedTokenIcon={wrappedTokenIcon}
                data-testid={dataTestId}
            />
        );
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
