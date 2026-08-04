import type { GetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber, isNotNull } from '@trezor/utils';

export const getFeeDecimals = ({
    symbol,
    getNetworkConfig,
}: { symbol: NetworkSymbol } & GetNetworkConfigDep) => {
    const network = getNetworkConfig(symbol);

    switch (network.networkType) {
        case 'ethereum': {
            return 9;
        }

        case 'bitcoin': {
            return 2;
        }

        default:
            return null;
    }
};

export const getFeeValue = ({
    feeRate,
    symbol,
    getNetworkConfig,
}: {
    feeRate: string | undefined;
    symbol: NetworkSymbol | undefined;
} & GetNetworkConfigDep) => {
    if (!feeRate || !symbol) {
        return undefined;
    }

    const decimals = getFeeDecimals({ symbol, getNetworkConfig });

    if (isNotNull(decimals)) {
        return new BigNumber(feeRate).decimalPlaces(decimals, 1 /*ROUND_DOWN*/).toFixed();
    }

    return feeRate;
};
