import { useMemo } from 'react';

import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { type RateTypeWithoutHistoric } from '@suite-common/wallet-types';
import { type AmountUnit, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';

import { useSelector } from './useSelector';

interface CommonOwnProps {
    amount: string | AmountUnit; // Todo: remove `string` only for back compatibility
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    rateType?: RateTypeWithoutHistoric;
}

export interface UseFiatFromCryptoValueParams extends CommonOwnProps {
    historicRate?: number;
    useHistoricRate?: boolean;
}

export const useFiatFromCryptoValue = ({
    amount,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
    rateType,
}: UseFiatFromCryptoValueParams) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, tokenAddress);

    /**
     * Only the number: every fetch rewrites the rate entry, even when the price stays the same.
     * With the historic rate, skip the current one so its changes don't re-render.
     */
    const currentRate = useSelector(state =>
        useHistoricRate
            ? undefined
            : selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType)?.rate,
    );

    const rate = useHistoricRate ? historicRate : currentRate;
    const fiatAmount = useMemo(
        () => (rate ? toFiatCurrency({ amount, rate }) : null),
        [amount, rate],
    );

    return { baseCurrencyCode, fiatAmount, fiatRateKey, rate };
};
