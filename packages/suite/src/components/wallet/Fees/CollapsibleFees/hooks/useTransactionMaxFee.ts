import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
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
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const transactionInfo = selectedFeeLevel ? composedLevels?.[selectedFeeLevel.label] : null;
    const txFee = transactionInfo?.type !== 'error' ? transactionInfo?.fee : null;

    return useMemo(() => {
        if (!txFee) {
            return null;
        }

        return roundToNonZeroFractionDigits(
            subunitsToUnits(networkConfigDeps, {
                value: asAmountSubunit(new BigNumber(txFee)),
                symbol: networkSymbol,
                decimals: getNetwork(networkConfigDeps, networkSymbol)?.decimals,
            }),
            4,
        ).toString();
    }, [networkConfigDeps, networkSymbol, txFee]);
}

export type TransactionMaxFee = ReturnType<typeof useTransactionMaxFee>;
