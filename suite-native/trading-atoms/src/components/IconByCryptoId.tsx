import type { CryptoId } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { type NetworkDisplaySymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { CryptoIcon, type CryptoIconSize } from '@suite-native/icons';

export type IconByCryptoIdProps = {
    cryptoId: CryptoId;
    size?: CryptoIconSize | number;
};

export const IconByCryptoId = ({ cryptoId, size }: IconByCryptoIdProps) => {
    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);
    invariant(symbol, `Network symbol not found for cryptoId: ${cryptoId}`);

    // when there is no contract address, we want to use display symbol instead
    // this way we can present ETH icon for EVMs instead of network icon
    const adjustedSymbol = contractAddress
        ? symbol
        : (getDisplaySymbol(symbol) as NetworkDisplaySymbol);

    return <CryptoIcon symbol={adjustedSymbol} contractAddress={contractAddress} size={size} />;
};
