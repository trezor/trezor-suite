import { useMemo } from 'react';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    buildFiatOption,
    cryptoIdToNetworkSymbol,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useSelector } from 'src/hooks/suite';
import {
    CoinmarketExchangeFormDefaultValuesProps,
    ExchangeType,
    KycFilter,
    RateType,
    RateTypeFilter,
} from 'src/types/coinmarket/coinmarketForm';
import { FormState, Output } from '@suite-common/wallet-types';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellFormDefaultValues';
import {
    EXCHANGE_COMPARATOR_KYC_FILTER,
    EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    EXCHANGE_COMPARATOR_RATE_FILTER,
    EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    FORM_EXCHANGE_CEX,
    FORM_EXCHANGE_TYPE,
    FORM_RATE_FIXED,
    FORM_RATE_TYPE,
} from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { coinmarketGetExchangeReceiveCryptoId } from 'src/utils/wallet/coinmarket/exchangeUtils';

export const useCoinmarketExchangeFormDefaultValues = (
    account: Account,
): CoinmarketExchangeFormDefaultValuesProps => {
    const { buildDefaultCryptoOption } = useCoinmarketInfo();
    const localCurrency = useSelector(selectLocalCurrency);
    const defaultCurrency = useMemo(() => buildFiatOption(localCurrency), [localCurrency]);
    const cryptoGroups = useCoinmarketBuildAccountGroups('exchange');
    const cryptoOptions = cryptoGroups.flatMap(group => group.options);
    const defaultSendCryptoSelect = useMemo(
        () =>
            cryptoOptions.find(
                option =>
                    option.descriptor === account.descriptor &&
                    cryptoIdToNetworkSymbol(option.value) === account.symbol,
            ),
        [account.descriptor, account.symbol, cryptoOptions],
    );
    const defaultReceiveCryptoSelect = useMemo(
        () =>
            buildDefaultCryptoOption(
                coinmarketGetExchangeReceiveCryptoId(defaultSendCryptoSelect?.value),
            ),
        [buildDefaultCryptoOption, defaultSendCryptoSelect?.value],
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
            receiveCryptoSelect: defaultReceiveCryptoSelect,
            [FORM_RATE_TYPE]: FORM_RATE_FIXED as RateType,
            [FORM_EXCHANGE_TYPE]: FORM_EXCHANGE_CEX as ExchangeType,
            [EXCHANGE_COMPARATOR_RATE_FILTER]:
                EXCHANGE_COMPARATOR_RATE_FILTER_ALL as RateTypeFilter,
            [EXCHANGE_COMPARATOR_KYC_FILTER]: EXCHANGE_COMPARATOR_KYC_FILTER_ALL as KycFilter,
        }),
        [defaultFormState, defaultSendCryptoSelect, defaultReceiveCryptoSelect],
    );

    return { defaultValues, defaultCurrency };
};
