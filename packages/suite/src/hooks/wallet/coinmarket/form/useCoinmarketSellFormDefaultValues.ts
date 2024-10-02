import { useMemo } from 'react';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    buildFiatOption,
    coinmarketBuildAccountOptions,
    cryptoIdToNetworkSymbol,
    getDefaultCountry,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import {
    CoinmarketAccountsOptionsGroupProps,
    CoinmarketPaymentMethodListProps,
    CoinmarketTradeSellExchangeType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketSellFormDefaultValuesProps } from 'src/types/coinmarket/coinmarketForm';
import { FormState, Output } from '@suite-common/wallet-types';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import { useSelector, useDefaultAccountLabel } from 'src/hooks/suite';
import { selectAccounts, selectDevice } from '@suite-common/wallet-core';
import {
    FORM_DEFAULT_FIAT_CURRENCY,
    FORM_DEFAULT_PAYMENT_METHOD,
} from 'src/constants/wallet/coinmarket/form';

export const useCoinmarketBuildAccountGroups = (
    type: CoinmarketTradeSellExchangeType,
): CoinmarketAccountsOptionsGroupProps[] => {
    const accounts = useSelector(selectAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const device = useSelector(selectDevice);
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const { tokenDefinitions } = useSelector(state => state);
    const supportedSymbols = useSelector(state =>
        type === 'sell'
            ? state.wallet.coinmarket.sell.sellInfo?.supportedCryptoCurrencies
            : state.wallet.coinmarket.exchange.exchangeInfo?.sellSymbols,
    );

    const groups = useMemo(
        () =>
            coinmarketBuildAccountOptions({
                accounts,
                deviceState: device?.state,
                accountLabels,
                tokenDefinitions,
                supportedCryptoIds: supportedSymbols,
                getDefaultAccountLabel,
            }),
        [
            accounts,
            supportedSymbols,
            accountLabels,
            device,
            tokenDefinitions,
            getDefaultAccountLabel,
        ],
    );

    return groups;
};

export const useCoinmarketSellFormDefaultValues = (
    account: Account,
    sellInfo: SellInfo | undefined,
): CoinmarketSellFormDefaultValuesProps => {
    const country = sellInfo?.sellList?.country;
    const cryptoGroups = useCoinmarketBuildAccountGroups('sell');
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
