import { useMemo } from 'react';

import { BigNumber } from '@trezor/utils';

export function computeGasFeeInWei(gasLimit: string, gasPriceInWei: string): string {
    return new BigNumber(gasLimit).multipliedBy(gasPriceInWei).toFixed(0);
}

export function useHasSufficientFundsForGas(
    totalFeeInWei: string | undefined,
    accountBalance: string,
): boolean {
    return useMemo(
        () => !totalFeeInWei || new BigNumber(totalFeeInWei).lte(accountBalance),
        [totalFeeInWei, accountBalance],
    );
}
