import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatRatesRootState, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import {
    fromFiatCurrency,
    getFiatRateKey,
    getNetwork,
    isTestnet,
} from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { TokenAddress } from '@suite-common/wallet-types';

type useConvertFiatToCryptoParams = {
    networkSymbol: NetworkSymbol;
    tokenAddress?: TokenAddress;
    tokenDecimals?: number;
    historicRate?: number;
    useHistoricRate?: boolean;
    isBalance?: boolean;
};

export const useCryptoFiatConverters = ({
    networkSymbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
    isBalance,
}: useConvertFiatToCryptoParams) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(networkSymbol, fiatCurrencyCode, tokenAddress);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;

    const decimals = getNetwork(networkSymbol)?.decimals;

    const isTestnetCoin = isTestnet(networkSymbol);

    if (!rate || !decimals || currentRate?.error || isTestnetCoin) return null;

    return {
        convertFiatToCrypto: (cryptoValue: string) => fromFiatCurrency(cryptoValue, decimals, rate),
        convertCryptoToFiat: (cryptoValue: string) =>
            convertCryptoToFiatAmount({
                rate,
                network: networkSymbol,
                isBalance,
                value: cryptoValue,
            }),
    };
};
