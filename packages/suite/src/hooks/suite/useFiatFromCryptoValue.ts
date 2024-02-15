import { useSelector } from 'src/hooks/suite';

import { Network } from 'src/types/wallet';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { TimestampedRates } from 'src/types/wallet/fiatRates';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

interface CommonOwnProps {
    amount: string;
    symbol: Network['symbol'] | string;
    tokenAddress?: string;
    fiatCurrency?: string;
}

interface DefaultSourceProps extends CommonOwnProps {
    source?: never;
    useCustomSource?: never;
}

interface CustomSourceProps extends CommonOwnProps {
    source: TimestampedRates['rates'] | undefined | null;
    useCustomSource?: boolean;
}

export type useFiatFromCryptoValueParams = DefaultSourceProps | CustomSourceProps;

export const useFiatFromCryptoValue = ({
    amount,
    symbol,
    tokenAddress,
    fiatCurrency,
    useCustomSource,
    source,
}: useFiatFromCryptoValueParams) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(
        symbol as NetworkSymbol,
        localCurrency,
        tokenAddress as TokenAddress,
    );

    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const targetCurrency = fiatCurrency ?? localCurrency;

    const ratesSource = useCustomSource ? source : { [localCurrency]: currentRate?.rate };
    const fiatAmount: string | null = ratesSource
        ? toFiatCurrency(amount, targetCurrency, ratesSource)
        : null;

    return { targetCurrency, fiatAmount, ratesSource, currentRate };
};
