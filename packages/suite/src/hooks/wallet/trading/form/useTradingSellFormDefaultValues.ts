import { useMemo } from 'react';

import {
    type TradingPaymentMethodListProps,
    cryptoIdToSymbol,
    getDefaultCountry,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { FormState, Output } from '@suite-common/wallet-types';

import { SellInfo } from 'src/actions/wallet/tradingSellActions';
import {
    FORM_DEFAULT_FIAT_CURRENCY,
    FORM_DEFAULT_PAYMENT_METHOD,
} from 'src/constants/wallet/trading/form';
import { useSelector } from 'src/hooks/suite';
import { useTradingBuildAccountGroups } from 'src/hooks/wallet/trading/form/common/useTradingBuildAccountGroups';
import { TradingSellFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';
import {
    buildFiatOption,
    getAddressAndTokenFromAccountOptionsGroupProps,
} from 'src/utils/wallet/trading/tradingUtils';

export const useTradingSellFormDefaultValues = (
    account: Account,
    sellInfo: SellInfo | undefined,
): TradingSellFormDefaultValuesProps => {
    const country = sellInfo?.sellList?.country;
    const cryptoGroups = useTradingBuildAccountGroups('sell');
    const prefilledFromCryptoId = useSelector(state => state.wallet.trading.prefilledFromCryptoId);
    const cryptoOptions = useMemo(
        () => cryptoGroups.flatMap(group => group.options),
        [cryptoGroups],
    );
    const defaultSendCryptoSelect = useMemo(
        () =>
            (prefilledFromCryptoId &&
                cryptoOptions.find(option => option.value === prefilledFromCryptoId)) ||
            cryptoOptions.find(
                option =>
                    option.descriptor === account.descriptor &&
                    account.symbol === cryptoIdToSymbol(option.value),
            ),
        [account.descriptor, account.symbol, prefilledFromCryptoId, cryptoOptions],
    );
    const defaultCountry = useMemo(() => getDefaultCountry(country), [country]);
    const { address, token } =
        getAddressAndTokenFromAccountOptionsGroupProps(defaultSendCryptoSelect);

    const defaultPaymentMethod: TradingPaymentMethodListProps = useMemo(
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
