import { useMemo } from 'react';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    buildFiatOption,
    cryptoIdToNetworkSymbol,
    getDefaultCountry,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { CoinmarketPaymentMethodListProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketSellFormDefaultValuesProps } from 'src/types/coinmarket/coinmarketForm';
import { FormState, Output } from '@suite-common/wallet-types';
import {
    FORM_DEFAULT_FIAT_CURRENCY,
    FORM_DEFAULT_PAYMENT_METHOD,
} from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketBuildAccountGroups';

export const useCoinmarketSellFormDefaultValues = (
    account: Account,
    sellInfo: SellInfo | undefined,
): CoinmarketSellFormDefaultValuesProps => {
    const country = sellInfo?.sellList?.country;
    const cryptoGroups = useCoinmarketBuildAccountGroups('sell');
    const cryptoOptions = useMemo(
        () => cryptoGroups.flatMap(group => group.options),
        [cryptoGroups],
    );
    const defaultSendCryptoSelect = useMemo(
        () =>
            cryptoOptions.find(
                option =>
                    option.descriptor === account.descriptor &&
                    account.symbol === cryptoIdToNetworkSymbol(option.value),
            ),
        [account.descriptor, account.symbol, cryptoOptions],
    );
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);

    const defaultPaymentMethod: CoinmarketPaymentMethodListProps = useMemo(
        () => ({
            value: FORM_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
    );
    const defaultCurrency = useMemo(() => buildFiatOption(FORM_DEFAULT_FIAT_CURRENCY), []);
    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            currency: defaultCurrency,
            token: defaultSendCryptoSelect?.contractAddress ?? '',
        }),
        [defaultSendCryptoSelect?.contractAddress, defaultCurrency],
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
            sendCryptoSelect: defaultSendCryptoSelect,
            countrySelect: defaultCountry,
            paymentMethod: defaultPaymentMethod,
            amountInCrypto: true,
        }),
        [defaultSendCryptoSelect, defaultCountry, defaultPaymentMethod, defaultFormState],
    );

    return { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod };
};
