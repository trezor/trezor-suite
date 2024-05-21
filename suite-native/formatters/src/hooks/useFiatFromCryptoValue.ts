import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatRatesRootState, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey, isTestnet, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { TokenAddress } from '@suite-common/wallet-types';

import { convertTokenValueToDecimal } from '../utils';

type useFiatFromCryptoValueParams = {
    cryptoValue: string | null;
    network: NetworkSymbol;
    tokenAddress?: TokenAddress;
    tokenDecimals?: number;
    historicRate?: number;
    useHistoricRate?: boolean;
};

export const useFiatFromCryptoValue = ({
    cryptoValue,
    network,
    tokenAddress,
    tokenDecimals = 0,
    historicRate,
    useHistoricRate,
}: useFiatFromCryptoValueParams) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(network, fiatCurrencyCode, tokenAddress);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;

    const isTestnetCoin = isTestnet(network);

    if (!cryptoValue || !rate || currentRate?.error || isTestnetCoin) return null;

    if (tokenAddress) {
        const decimalValue = convertTokenValueToDecimal(cryptoValue, tokenDecimals);

        return toFiatCurrency(decimalValue.toString(), rate);
    }

    return convertCryptoToFiatAmount({
        value: cryptoValue,
        rate,
        network,
    });
};
