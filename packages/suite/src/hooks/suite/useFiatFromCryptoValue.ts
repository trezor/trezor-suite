import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { AmountBase, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

interface CommonOwnProps<TNetworkSymbol extends NetworkSymbol> {
    amount: AmountBase<TNetworkSymbol>;
    symbol: TNetworkSymbol;
    tokenAddress?: TokenAddress;
    fiatCurrency?: string;
}

export interface UseFiatFromCryptoValueParams<TNetworkSymbol extends NetworkSymbol>
    extends CommonOwnProps<TNetworkSymbol> {
    historicRate?: number;
    useHistoricRate?: boolean;
}

export const useFiatFromCryptoValue = <TNetworkSymbol extends NetworkSymbol>({
    amount,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
}: UseFiatFromCryptoValueParams<TNetworkSymbol>) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(symbol, localCurrency, tokenAddress);

    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const fiatAmount: string | null = rate ? toFiatCurrency(amount.toString(), rate) : null;

    return { localCurrency, fiatAmount, rate, currentRate };
};
