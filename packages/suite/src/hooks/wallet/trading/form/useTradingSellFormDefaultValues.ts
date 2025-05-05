import { useMemo } from 'react';

import {
    TRADING_DEFAULT_FIAT_CURRENCY,
    TRADING_DEFAULT_PAYMENT_METHOD,
    type TradingPaymentMethodListProps,
    type TradingSellInfoSelector,
    cryptoIdToSymbol,
    getDefaultCountry,
    regional,
    selectTradingPrefilledFromAccount,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { FormState, Output } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { useTradingBuildAccountGroups } from 'src/hooks/wallet/trading/form/common/useTradingBuildAccountGroups';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { TradingSellFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';
import {
    buildFiatOption,
    getAddressAndTokenFromAccountOptionsGroupProps,
} from 'src/utils/wallet/trading/tradingUtils';

export const useTradingSellFormDefaultValues = (
    account: Account,
    sellInfo: TradingSellInfoSelector | undefined,
): TradingSellFormDefaultValuesProps => {
    const cryptoGroups = useTradingBuildAccountGroups('sell');
    const prefilledFromAccount = useSelector(selectTradingPrefilledFromAccount);
    const { isTorEnabled } = useSelector(selectTorState);

    const cryptoOptions = useMemo(
        () => cryptoGroups.flatMap(group => group.options),
        [cryptoGroups],
    );
    const defaultSendCryptoSelect = useMemo(
        () =>
            (prefilledFromAccount.cryptoId &&
                cryptoOptions.find(option => option.value === prefilledFromAccount.cryptoId)) ||
            cryptoOptions.find(
                option =>
                    option.descriptor === account.descriptor &&
                    account.symbol === cryptoIdToSymbol(option.value),
            ),
        [account.descriptor, account.symbol, prefilledFromAccount, cryptoOptions],
    );
    const country = !isTorEnabled ? sellInfo?.country : regional.UNKNOWN_COUNTRY;
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const { address, token } =
        getAddressAndTokenFromAccountOptionsGroupProps(defaultSendCryptoSelect);

    const defaultPaymentMethod: TradingPaymentMethodListProps = useMemo(
        () => ({
            value: TRADING_DEFAULT_PAYMENT_METHOD,
            label: '',
        }),
        [],
    );
    const defaultCurrency = useMemo(() => buildFiatOption(TRADING_DEFAULT_FIAT_CURRENCY), []);
    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            currency: defaultCurrency,
            address,
            token,
        }),
        [defaultCurrency, address, token],
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
