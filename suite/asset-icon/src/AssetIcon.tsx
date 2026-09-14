import { useMemo } from 'react';

import { isCryptoIconSymbol, isNetworkIconSymbol } from '@suite-common/icons';
import { getCoingeckoId, getNetworkOptional, isNetworkSymbol } from '@suite-common/wallet-config';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import {
    isSupportedEthereumNetwork,
    isWrappedNativeToken,
} from '@trezor/network-ethereum/constants';
import { NetworkIconBadge, TokenIcon, type TokenIconProps } from '@trezor/product-components';
import { useAsyncMemo } from '@trezor/react-utils';

import { getCoingeckoIdAndContractAddressIncludesNativeTokens } from './assetIconUtils';

export type AssetIconProps = Omit<
    TokenIconProps,
    'coingeckoId' | 'contractAddresses' | 'symbol'
> & {
    symbol: NetworkSymbol;
    contractAddress?: string | null;
    wrappedTokenIcon?: 'token' | 'network';
};

type AssetLogoProps = AssetIconProps & { coingeckoId: string };

const AssetLogo = ({ symbol, contractAddress, coingeckoId, ...props }: AssetLogoProps) => {
    const addresses = useAsyncMemo(
        () => getAssetLogoContractAddresses(symbol, contractAddress),
        [symbol, contractAddress],
    );
    const logo = useMemo(
        () => getCoingeckoIdAndContractAddressIncludesNativeTokens(coingeckoId, addresses),
        [coingeckoId, addresses],
    );

    return <TokenIcon {...props} symbol={symbol} {...logo} />;
};

export const AssetIcon = ({
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
}: AssetIconProps) => {
    if (
        wrappedTokenIcon === 'network' &&
        isSupportedEthereumNetwork(symbol) &&
        isWrappedNativeToken(symbol, contractAddress)
    ) {
        contractAddress = null;
    }

    if (!contractAddress) {
        if (showNetworkIcon) {
            const network = getNetworkOptional(symbol);
            const networkSymbol = network?.settlementLayer ?? symbol;
            const displaySymbol = networkSymbol !== symbol ? networkSymbol : symbol;
            const tokenIcon = (
                <TokenIcon symbol={displaySymbol} size={size} data-testid={dataTestId} />
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

        return <TokenIcon symbol={symbol} size={size} data-testid={dataTestId} />;
    }

    const coingeckoId = isNetworkSymbol(symbol) ? getCoingeckoId(symbol) : undefined;

    if (!coingeckoId) {
        if (isCryptoIconSymbol(symbol)) {
            return <TokenIcon symbol={symbol} size={size} data-testid={dataTestId} />;
        }

        return null;
    }

    return (
        <AssetLogo
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
