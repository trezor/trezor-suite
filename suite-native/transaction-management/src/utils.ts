import { type NetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { BigNumber, isNotNull } from '@trezor/utils';

export const getFeeDecimals = (
    networkConfigDeps: NetworkConfigDeps,
    { symbol }: { symbol: NetworkSymbol },
) => {
    const network = getNetwork(networkConfigDeps, symbol);

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

export const getFeeValue = (
    networkConfigDeps: NetworkConfigDeps,
    {
        feeRate,
        symbol,
    }: {
        feeRate: string | undefined;
        symbol: NetworkSymbol | undefined;
    },
) => {
    if (!feeRate || !symbol) {
        return undefined;
    }

    const decimals = getFeeDecimals(networkConfigDeps, { symbol });

    if (isNotNull(decimals)) {
        return new BigNumber(feeRate).decimalPlaces(decimals, 1 /*ROUND_DOWN*/).toFixed();
    }

    return feeRate;
};
