import { UseFormSetValue } from 'react-hook-form';

import { NetworkSymbol, NetworkType, getNetwork } from '@suite-common/wallet-config';
import { EVM_FEE_RATE_DECIMALS } from '@suite-common/wallet-core';
import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { hasEip1559MaxPriorityFee, isEip1559 } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { FeesFormValues } from './feesFormSchema';

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

    if (decimals !== null) {
        return new BigNumber(feeRate).decimalPlaces(decimals, 1 /*ROUND_DOWN*/).toFixed();
    }

    return feeRate;
};

export const prefillCustomFeeFields = (
    setValue: UseFormSetValue<FeesFormValues>,
    feeLevel: PrecomposedTransactionFinal,
    networkType: NetworkType,
) => {
    let feePerUnit = feeLevel.feePerByte;

    if (networkType === 'ethereum') {
        const value = isEip1559(feeLevel)
            ? Number(feeLevel.maxFeePerGas)
            : Number(feeLevel.feePerByte);
        feePerUnit = value.toFixed(EVM_FEE_RATE_DECIMALS);
    }

    setValue('customFeePerUnit', feePerUnit, { shouldValidate: true });
    setValue('customFeeLimit', feeLevel.feeLimit, { shouldValidate: true });

    if (isEip1559(feeLevel)) {
        setValue('customMaxFeePerGas', feeLevel.maxFeePerGas, { shouldValidate: true });
    }

    if (hasEip1559MaxPriorityFee(feeLevel)) {
        setValue('customMaxPriorityFeePerGas', feeLevel.maxPriorityFeePerGas, {
            shouldValidate: true,
        });
    }
};
