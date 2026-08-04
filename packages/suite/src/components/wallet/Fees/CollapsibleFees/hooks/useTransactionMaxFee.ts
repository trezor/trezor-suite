import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
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
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
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
                decimals: getNetworkConfig(networkSymbol)?.decimals,
            }),
            4,
        ).toString();
    }, [networkSymbol, txFee]);
}

export type TransactionMaxFee = ReturnType<typeof useTransactionMaxFee>;
