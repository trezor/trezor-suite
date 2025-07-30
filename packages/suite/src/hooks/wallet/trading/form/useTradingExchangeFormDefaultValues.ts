import { useMemo } from 'react';

import {
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER,
    TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_RATE,
    TRADING_EXCHANGE_RATE_FIXED,
    TradingExchangeFormType,
    TradingExchangeKycFilter,
    TradingExchangeRateFilter,
    TradingExchangeRateType,
    cryptoIdToSymbol,
    enabledTradingCurrencies,
    selectTradingPrefilledFromAccount,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { selectLocalCurrency } from '@suite-common/wallet-core';
import { FormState, Output } from '@suite-common/wallet-types';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { isArrayMember, typedObjectValues } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingBuildAccountGroups } from 'src/hooks/wallet/trading/form/common/useTradingBuildAccountGroups';
import { TradingExchangeFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';
import {
    buildTradingFiatOption,
    getAddressAndTokenFromAccountOptionsGroupProps,
} from 'src/utils/wallet/trading/tradingUtils';

export const useTradingExchangeFormDefaultValues = (
    account: Account,
): TradingExchangeFormDefaultValuesProps => {
    const localCurrency = useSelector(selectLocalCurrency);
    const prefilledFromAccount = useSelector(selectTradingPrefilledFromAccount);

    const defaultCurrency = useMemo(
        () =>
            // Here, we are using BaseCurrency as a way how to determine the users preferred Sell/Buy currency,
            // however, they may not be available (or it is 'btc'). In that case, we fall back to 'usd'
            buildTradingFiatOption(
                isArrayMember(localCurrency, typedObjectValues(enabledTradingCurrencies))
                    ? localCurrency
                    : 'usd',
            ),
        [localCurrency],
    );
    const cryptoGroups = useTradingBuildAccountGroups('exchange');
    const cryptoOptions = useMemo(
        () => cryptoGroups.flatMap(group => group.options),
        [cryptoGroups],
    );

    const defaultSendCryptoSelect = useMemo(
        () =>
            (prefilledFromAccount.cryptoId &&
                cryptoOptions.find(
                    option =>
                        option.value === prefilledFromAccount.cryptoId &&
                        option.descriptor ===
                            parseAccountKey(prefilledFromAccount.key || '').accountDescriptor,
                )) ||
            cryptoOptions.find(
                option =>
                    option.descriptor === account.descriptor &&
                    cryptoIdToSymbol(option.value) === account.symbol,
            ),
        [account.descriptor, account.symbol, prefilledFromAccount, cryptoOptions],
    );

    const { address, token } =
        getAddressAndTokenFromAccountOptionsGroupProps(defaultSendCryptoSelect);

    const defaultPayment: Output = useMemo(
        () => ({
            ...DEFAULT_PAYMENT,
            currency: defaultCurrency,
            address,
            token,
        }),
        [address, defaultCurrency, token],
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
            [TRADING_EXCHANGE_RATE]: TRADING_EXCHANGE_RATE_FIXED as TradingExchangeRateType,
            [TRADING_EXCHANGE_FORM]: TRADING_EXCHANGE_FORM_CEX as TradingExchangeFormType,
            [TRADING_EXCHANGE_COMPARATOR_KYC_FILTER]:
                TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL as TradingExchangeKycFilter,
            [TRADING_EXCHANGE_COMPARATOR_RATE_FILTER]:
                TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL as TradingExchangeRateFilter,
        }),
        [defaultFormState, defaultSendCryptoSelect],
    );

    return { defaultValues, defaultCurrency };
};
