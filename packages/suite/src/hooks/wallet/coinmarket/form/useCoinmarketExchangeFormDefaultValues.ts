import { useMemo } from 'react';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { buildFiatOption } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useSelector } from 'src/hooks/suite';
import {
    CoinmarketExchangeFormDefaultValuesProps,
    ExchangeType,
    RateType,
} from 'src/types/coinmarket/coinmarketForm';
import { FormState, Output } from '@suite-common/wallet-types';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormDefaultValues';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { FORM_EXCHANGE_CEX, FORM_RATE_FIXED } from 'src/constants/wallet/coinmarket/form';

export const useCoinmarketExchangeFormDefaultValues = (
    account: Account,
): CoinmarketExchangeFormDefaultValuesProps => {
    const localCurrency = useSelector(selectLocalCurrency);
    const defaultCurrency = useMemo(() => buildFiatOption(localCurrency), [localCurrency]);
    const cryptoGroups = useCoinmarketBuildAccountGroups('exchange');
    const cryptoOptions = cryptoGroups.flatMap(group => group.options);
    const defaultSendCryptoSelect = useMemo(
        () =>
            cryptoOptions.find(
                option =>
                    option.descriptor === account.descriptor &&
                    cryptoToNetworkSymbol(option.value) === account.symbol,
            ),
        [account.descriptor, account.symbol, cryptoOptions],
    );

    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            currency: defaultCurrency,
        }),
        [defaultCurrency],
    );
    const defaultFormState: FormState = useMemo(
        () => ({
            ...DEFAULT_VALUES,
            selectedUtxos: [],
            options: ['broadcast'],
            outputs: [defaultPayment],
        }),
        [defaultPayment],
    );
    const defaultValues = useMemo(
        () => ({
            ...defaultFormState,
            amountInCrypto: true,
            sendCryptoSelect: defaultSendCryptoSelect,
            receiveCryptoSelect: null,
            rateType: FORM_RATE_FIXED as RateType,
            exchangeType: FORM_EXCHANGE_CEX as ExchangeType,
        }),
        [defaultFormState, defaultSendCryptoSelect],
    );

    return { defaultValues, defaultCurrency };
};
