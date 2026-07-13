import type { CryptoId } from 'invity-api';

import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { type NetworkDisplaySymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { TokenIcon, type TokenIconSize } from '@suite-native/icons';

export type IconByCryptoIdProps = {
    cryptoId: CryptoId;
    size?: TokenIconSize;
    withNetwork?: boolean;
};

export const IconByCryptoId = ({ cryptoId, size, withNetwork = false }: IconByCryptoIdProps) => {
    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    if (!symbol) {
        return null;
    }

    // when there is no contract address, we want to use display symbol instead
    // this way we can present ETH icon for EVMs instead of network icon
    const adjustedSymbol = contractAddress
        ? symbol
        : (getDisplaySymbol(symbol) as NetworkDisplaySymbol);

    return (
        <TokenIcon
            symbol={withNetwork ? symbol : adjustedSymbol}
            contractAddress={contractAddress}
            size={size}
            showNetworkIcon={withNetwork}
        />
    );
};
