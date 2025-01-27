import { useSelector } from 'react-redux';

import { convertCryptoToFiatAmount, convertFiatToCryptoAmount } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatRatesRootState, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey, isTestnet } from '@suite-common/wallet-utils';
import {
    SettingsSliceRootState,
    selectFiatCurrencyCode,
    selectIsAmountInSats,
} from '@suite-native/settings';

type UseConvertFiatToCryptoParams = {
    symbol: NetworkSymbol | null;
    tokenContract?: TokenAddress;
    tokenDecimals?: number;
    historicRate?: number;
    useHistoricRate?: boolean;
    isBalance?: boolean;
};

export const useCryptoFiatConverters = ({
    symbol,
    tokenContract,
    historicRate,
    useHistoricRate,
}: UseConvertFiatToCryptoParams) => {
    const symbolHelper = symbol ?? 'btc'; // handles passing the value to selectors
    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbolHelper),
    );

    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(symbolHelper, fiatCurrencyCode, tokenContract);
    const currentRate = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const rate = useHistoricRate ? historicRate : currentRate?.rate;
    const isTestnetCoin = isTestnet(symbolHelper);

    if (!rate || currentRate?.error || isTestnetCoin || !symbol) return null;

    return {
        convertFiatToCrypto: (amount: string) =>
            convertFiatToCryptoAmount({
                amount,
                symbol,
                isAmountInSats,
                rate,
            }),
        convertCryptoToFiat: (amount: string) =>
            convertCryptoToFiatAmount({
                amount,
                symbol,
                isAmountInSats,
                rate,
            }),
    };
};
