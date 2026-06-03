import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { type RateTypeWithoutHistoric, type TokenAddress } from '@suite-common/wallet-types';
import { type AmountUnit, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';

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
    const baseCurrencyCode = useSelector((state: WalletSettingsRootState) =>
        selectBaseCurrency(state),
    );
    const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, tokenAddress);

    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const fiatAmount = useMemo(
        () => (rate ? toFiatCurrency({ amount, rate }) : null),
        [amount, rate],
    );

    return { baseCurrencyCode, fiatAmount, rate, currentRate };
};
