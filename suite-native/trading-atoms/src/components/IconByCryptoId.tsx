import type { CryptoId } from 'invity-api';

import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { TokenIcon, type TokenIconSize } from '@suite-native/icons';

export type IconByCryptoIdProps = {
    cryptoId: CryptoId;
    size?: TokenIconSize;
    withNetwork?: boolean;
    tokenSymbol: string | null | undefined;
};

export const IconByCryptoId = ({
    cryptoId,
    size,
    tokenSymbol,
    withNetwork = false,
}: IconByCryptoIdProps) => {
    const { symbol: networkSymbol, contractAddress } =
        cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    if (!networkSymbol) {
        return null;
    }

    // when there is no contract address, we want to use display symbol instead
    // this way we can present ETH icon for EVMs instead of network icon
    const adjustedSymbol = contractAddress ? networkSymbol : getDisplaySymbol(networkSymbol);

    return (
        <TokenIcon
            networkSymbol={withNetwork ? networkSymbol : adjustedSymbol}
            contractAddress={contractAddress}
            tokenSymbol={tokenSymbol}
            size={size}
            showNetworkIcon={withNetwork}
        />
    );
};
