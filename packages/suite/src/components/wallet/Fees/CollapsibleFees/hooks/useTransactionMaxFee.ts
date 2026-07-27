import { useMemo } from 'react';

import { getNetwork } from '@suite-common/wallet-config';
import {
    asAmountSubunit,
    roundToNonZeroFractionDigits,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type FeesContextType } from '../../context/FeesContext';

export type TransactionMaxFeeProps = Pick<FeesContextType, 'networkSymbol' | 'composedLevels'> & {
    selectedFeeLevel?: FeesContextType['selectedFeeLevel'];
};

export function useTransactionMaxFee({
    networkSymbol,
    composedLevels,
    selectedFeeLevel,
}: TransactionMaxFeeProps) {
    const transactionInfo = selectedFeeLevel ? composedLevels?.[selectedFeeLevel.label] : null;
    const txFee = transactionInfo?.type !== 'error' ? transactionInfo?.fee : null;

    return useMemo(() => {
        if (!txFee) {
            return null;
        }

        return roundToNonZeroFractionDigits(
            subunitsToUnits({
                value: asAmountSubunit(new BigNumber(txFee)),
                symbol: networkSymbol,
                decimals: getNetwork(networkSymbol)?.decimals,
            }),
            4,
        ).toString();
    }, [networkSymbol, txFee]);
}

export type TransactionMaxFee = ReturnType<typeof useTransactionMaxFee>;
