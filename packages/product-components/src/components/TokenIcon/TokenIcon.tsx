import { useServices } from '@suite-common/dependency-injection';
import { isCryptoIconSymbol, isNetworkIconSymbol } from '@suite-common/icons';
import { selectNetworkConfigDeps, toNetwork } from '@suite-common/wallet-config';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

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
    const { getNetworkConfig, networkModuleRepository } = useServices(selectNetworkConfigDeps);

    if (wrappedTokenIcon === 'network' && isWrappedNativeToken(symbol, contractAddress)) {
        contractAddress = null;
    }

    if (!contractAddress) {
        if (showNetworkIcon) {
            const networkSymbol = networkModuleRepository.isSupportedNetwork(symbol)
                ? (toNetwork(symbol, getNetworkConfig(symbol)).settlementLayer ?? symbol)
                : symbol;
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

    const coingeckoId = networkModuleRepository.isSupportedNetwork(symbol)
        ? getNetworkConfig(symbol).coingeckoId
        : undefined;

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
