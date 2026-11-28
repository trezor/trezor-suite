import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { type AmountUnit, toFiatCurrency } from '@suite-common/wallet-utils';

import {
    type FiatRateParams,
    selectFiatRateForCryptoValue,
} from '#src/selectors/wallet/fiatRateSelectors';

export interface UseFiatFromCryptoValueParams extends FiatRateParams {
    amount: string | AmountUnit; // Todo: remove `string` only for back compatibility
}

export const useFiatFromCryptoValue = ({
    amount,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
    rateType,
}: UseFiatFromCryptoValueParams) => {
    const rate = useSelector((state: FiatRatesRootState & WalletSettingsRootState) =>
        selectFiatRateForCryptoValue(state, {
            symbol,
            tokenAddress,
            rateType,
            historicRate,
            useHistoricRate,
        }),
    );

    const fiatAmount = useMemo(
        () => (rate ? toFiatCurrency({ amount, rate }) : null),
        [amount, rate],
    );

    return { fiatAmount, rate };
};
