import type { CryptoId } from 'invity-api';

import { getNativeAssetIconSymbol } from '@suite-common/icons';
import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
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

    const adjustedSymbol = contractAddress
        ? networkSymbol
        : getNativeAssetIconSymbol(networkSymbol);

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
