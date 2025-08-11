import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { AmountUnit, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

interface CommonOwnProps {
    amount: string | AmountUnit; // Todo: remove `string` only for back compatibility
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
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
}: UseFiatFromCryptoValueParams) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, tokenAddress);

    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const fiatAmount = rate ? toFiatCurrency({ amount, rate }) : null;

    return { baseCurrencyCode, fiatAmount, rate, currentRate };
};
