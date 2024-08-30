import { useSelector } from 'src/hooks/suite';

import { NetworkCompatible } from '@suite-common/wallet-config';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { TokenTransfer } from '@trezor/blockchain-link-types';

interface CommonOwnProps {
    amount: string;
    symbol: NetworkCompatible['symbol'] | TokenTransfer['symbol'];
    tokenAddress?: TokenAddress;
    fiatCurrency?: string;
}

export interface useFiatFromCryptoValueParams extends CommonOwnProps {
    historicRate?: number;
    useHistoricRate?: boolean;
}

export const useFiatFromCryptoValue = ({
    amount,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
}: useFiatFromCryptoValueParams) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(symbol as NetworkSymbol, localCurrency, tokenAddress);

    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const fiatAmount: string | null = rate ? toFiatCurrency(amount, rate) : null;

    return { localCurrency, fiatAmount, rate, currentRate };
};
