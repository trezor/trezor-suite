import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FiatRatesRootState,
    getFiatRateKey,
    selectFiatRatesByFiatRateKey,
} from '@suite-native/fiat-rates';
import { isTestnet } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode, selectFiatCurrency } from '@suite-native/module-settings';
import { FiatRates } from '@trezor/blockchain-link';

export const useFiatValueConvertedFromCrypto = ({
    cryptoValue,
    network,
    customRates,
}: {
    cryptoValue: string | null;
    network: NetworkSymbol;
    customRates?: FiatRates;
}) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(network, fiatCurrencyCode);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );
    const fiatCurrency = useSelector(selectFiatCurrency);

    const isTestnetCoin = isTestnet(network);

    if (!cryptoValue || !currentRate || currentRate.error || isTestnetCoin) return null;

    const fiatValue = convertCryptoToFiatAmount({
        value: cryptoValue,
        rates: customRates ?? { [fiatCurrencyCode]: currentRate?.rate },
        fiatCurrency: fiatCurrency.label,
        network,
    });

    return fiatValue;
};
