import { type NetworkSymbol, type NetworkType, getNetwork } from '@suite-common/wallet-config';
import { type FormState } from '@suite-common/wallet-types';
import { BigNumber, isNotNull } from '@trezor/utils';

export const getFeeDecimals = ({ symbol }: { symbol: NetworkSymbol }) => {
    const network = getNetwork(symbol);

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
}: {
    feeRate: string | undefined;
    symbol: NetworkSymbol | undefined;
}) => {
    if (!feeRate || !symbol) {
        return undefined;
    }

    const decimals = getFeeDecimals({ symbol });

    if (isNotNull(decimals)) {
        return new BigNumber(feeRate).decimalPlaces(decimals, 1 /*ROUND_DOWN*/).toFixed();
    }

    return feeRate;
};

export const getTransactionReviewNetworkOptions = (networkType?: NetworkType) => ({
    isSummaryItemEnabled: networkType !== 'tron',
    isSlidingOverlayEnabled: networkType !== 'solana',
});

export const hasNewCustomFee = (composed: FormState, current: FormState | undefined): boolean =>
    current?.selectedFee === 'custom' &&
    (composed.selectedFee !== 'custom' ||
        current.feePerUnit !== composed.feePerUnit ||
        current.feeLimit !== composed.feeLimit ||
        current.maxFeePerGas !== composed.maxFeePerGas ||
        current.maxPriorityFeePerGas !== composed.maxPriorityFeePerGas);
