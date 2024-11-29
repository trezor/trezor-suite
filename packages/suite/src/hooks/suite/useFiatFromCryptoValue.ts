import { NetworkSymbol } from '@suite-common/wallet-config';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';

import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useSelector } from 'src/hooks/suite';

interface CommonOwnProps {
    amount: string;
    symbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    fiatCurrency?: string;
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
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(symbol, localCurrency, tokenAddress);

    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const fiatAmount: string | null = rate ? toFiatCurrency(amount, rate) : null;

    return { localCurrency, fiatAmount, rate, currentRate };
};
