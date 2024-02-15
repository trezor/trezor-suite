import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FiatRatesRootState,
    getFiatRateKey,
    selectFiatRatesByFiatRateKey,
} from '@suite-native/fiat-rates';
import { isTestnet, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode, selectFiatCurrency } from '@suite-native/module-settings';
import { FiatRatesLegacy } from '@trezor/blockchain-link';
import { TokenAddress } from '@suite-common/wallet-types';

import { convertTokenValueToDecimal } from '../utils';

type useFiatFromCryptoValueParams = {
    cryptoValue: string | null;
    network: NetworkSymbol;
    tokenAddress?: TokenAddress;
    tokenDecimals?: number;
    customRates?: FiatRatesLegacy;
};

export const useFiatFromCryptoValue = ({
    cryptoValue,
    network,
    tokenAddress,
    tokenDecimals = 0,
    customRates,
}: useFiatFromCryptoValueParams) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(network, fiatCurrencyCode, tokenAddress);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rates = customRates ?? { [fiatCurrencyCode]: currentRate?.rate };
    const fiatCurrency = useSelector(selectFiatCurrency);

    const isTestnetCoin = isTestnet(network);

    if (!cryptoValue || !rates || rates.error || isTestnetCoin) return null;

    if (tokenAddress) {
        const decimalValue = convertTokenValueToDecimal(cryptoValue, tokenDecimals);

        return toFiatCurrency(decimalValue.toString(), fiatCurrencyCode, rates);
    }

    return convertCryptoToFiatAmount({
        value: cryptoValue,
        rates,
        fiatCurrency: fiatCurrency.label,
        network,
    });
};
