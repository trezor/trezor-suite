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
        () =>
            !totalFeeInWei ||
            // A placeholder account (network not supported or not discovered in Suite) has an
            // empty balance. The balance is not known, so do not report insufficient funds.
            !accountBalance ||
            new BigNumber(totalFeeInWei).lte(accountBalance),
        [totalFeeInWei, accountBalance],
    );
}
