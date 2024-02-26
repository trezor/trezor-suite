import { useSelector } from 'src/hooks/suite';

import { Network } from 'src/types/wallet';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectCoinsLegacy } from '@suite-common/wallet-core';
import { TimestampedRates } from 'src/types/wallet/fiatRates';

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
    const coins = useSelector(selectCoinsLegacy);

    const targetCurrency = fiatCurrency ?? localCurrency;
    const currentFiatRates = coins.find(f =>
        tokenAddress
            ? f.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase()
            : f.symbol.toLowerCase() === symbol.toLowerCase() && !f.tokenAddress,
    )?.current;

    const ratesSource = useCustomSource ? source : currentFiatRates?.rates;
    const fiatAmount: string | null = ratesSource
        ? toFiatCurrency(amount, targetCurrency, ratesSource)
        : null;

    return { targetCurrency, fiatAmount, ratesSource, currentFiatRates };
};
