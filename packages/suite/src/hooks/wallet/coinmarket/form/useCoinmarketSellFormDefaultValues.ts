import { useMemo } from 'react';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    buildFiatOption,
    coinmarketBuildAccountOptions,
    getDefaultCountry,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import {
    CoinmarketAccountsOptionsGroupProps,
    CoinmarketPaymentMethodListProps,
} from 'src/types/coinmarket/coinmarket';
import { formDefaultCurrency } from 'src/constants/wallet/coinmarket/formDefaults';
import { CoinmarketSellFormDefaultValuesProps } from 'src/types/coinmarket/coinmarketForm';
import { FormState, Output } from '@suite-common/wallet-types';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';
import { selectAccounts, selectDevice } from '@suite-common/wallet-core';
import { useAccountLabel } from 'src/components/suite/AccountLabel';

export const useCoinmarketBuildAccountGroups = (): CoinmarketAccountsOptionsGroupProps[] => {
    const accounts = useSelector(selectAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const device = useSelector(selectDevice);
    const { defaultAccountLabelString } = useAccountLabel();
    const { symbolsInfo } = useSelector(state => state.wallet.coinmarket.info);

    const groups = useMemo(
        () =>
            coinmarketBuildAccountOptions({
                accounts,
                deviceState: device?.state,
                symbolsInfo,
                accountLabels,
                defaultAccountLabelString,
            }),
        [symbolsInfo, accounts, accountLabels, device, defaultAccountLabelString],
    );

    return groups;
};

export const useCoinmarketSellFormDefaultValues = (
    account: Account,
    sellInfo: SellInfo | undefined,
    paymentMethods: CoinmarketPaymentMethodListProps[],
    defaultAddress?: string,
): CoinmarketSellFormDefaultValuesProps => {
    const country = sellInfo?.sellList?.country;
    const cryptoGroups = useCoinmarketBuildAccountGroups();
    const cryptoOptions = cryptoGroups.flatMap(group => group.options);
    const defaultCrypto = useMemo(
        () => cryptoOptions.find(option => option.descriptor === account.descriptor),
        [account.descriptor, cryptoOptions],
    );
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const defaultPaymentMethod: CoinmarketPaymentMethodListProps = useMemo(
        () =>
            paymentMethods.find(paymentMethod => paymentMethod.value === 'creditCard') ?? {
                value: '',
                label: '',
            },
        [paymentMethods],
    );
    const defaultCurrency = useMemo(() => buildFiatOption(formDefaultCurrency), []);
    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            address: defaultAddress ?? defaultCrypto?.descriptor ?? '',
            token: defaultCrypto?.contractAddress ?? '',
        }),
        [defaultCrypto?.contractAddress, defaultCrypto?.descriptor, defaultAddress],
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
            fiatInput: '',
            cryptoInput: '',
            currencySelect: defaultCurrency,
            cryptoSelect: defaultCrypto,
            countrySelect: defaultCountry,
            paymentMethod: defaultPaymentMethod,
            amountInCrypto: true,
        }),
        [defaultCurrency, defaultCrypto, defaultCountry, defaultPaymentMethod, defaultFormState],
    );

    return { defaultValues, defaultCountry, defaultCurrency, defaultPaymentMethod };
};
