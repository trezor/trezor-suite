import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount, convertFiatToCryptoAmount } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatRatesRootState, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey, isTestnet } from '@suite-common/wallet-utils';
import {
    selectFiatCurrencyCode,
    selectIsAmountInSats,
    SettingsSliceRootState,
} from '@suite-native/settings';
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
}: useConvertFiatToCryptoParams) => {
    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, networkSymbol),
    );
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(networkSymbol, fiatCurrencyCode, tokenAddress);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const isTestnetCoin = isTestnet(networkSymbol);

    if (!rate || currentRate?.error || isTestnetCoin) return null;

    return {
        convertFiatToCrypto: (amount: string) =>
            convertFiatToCryptoAmount({
                amount,
                networkSymbol,
                isAmountInSats,
                rate,
            }),
        convertCryptoToFiat: (amount: string) =>
            convertCryptoToFiatAmount({
                amount,
                networkSymbol,
                isAmountInSats,
                rate,
            }),
    };
};
