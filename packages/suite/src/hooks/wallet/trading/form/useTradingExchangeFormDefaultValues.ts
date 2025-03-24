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
    exchangeUtils,
    useTradingInfo,
} from '@suite-common/trading';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { FormState, Output } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { useTradingBuildAccountGroups } from 'src/hooks/wallet/trading/form/common/useTradingBuildAccountGroups';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { TradingExchangeFormDefaultValuesProps } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';
import {
    buildFiatOption,
    getAddressAndTokenFromAccountOptionsGroupProps,
} from 'src/utils/wallet/trading/tradingUtils';

export const useTradingExchangeFormDefaultValues = (
    account: Account,
): TradingExchangeFormDefaultValuesProps => {
    const { buildDefaultCryptoOption } = useTradingInfo('exchange');
    const localCurrency = useSelector(selectLocalCurrency);
    const prefilledFromCryptoId = useSelector(state => state.wallet.trading.prefilledFromCryptoId);
    const defaultCurrency = useMemo(() => buildFiatOption(localCurrency), [localCurrency]);
    const cryptoGroups = useTradingBuildAccountGroups('exchange');
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
                    cryptoIdToSymbol(option.value) === account.symbol,
            ),
        [account.descriptor, account.symbol, prefilledFromCryptoId, cryptoOptions],
    );
    const { address, token } =
        getAddressAndTokenFromAccountOptionsGroupProps(defaultSendCryptoSelect);

    const defaultReceiveCryptoSelect = useMemo(
        () =>
            buildDefaultCryptoOption(
                exchangeUtils.tradingGetExchangeReceiveCryptoId(defaultSendCryptoSelect?.value),
            ),
        [buildDefaultCryptoOption, defaultSendCryptoSelect?.value],
    );

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
            receiveCryptoSelect: defaultReceiveCryptoSelect,
            [TRADING_EXCHANGE_RATE]: TRADING_EXCHANGE_RATE_FIXED as TradingExchangeRateType,
            [TRADING_EXCHANGE_FORM]: TRADING_EXCHANGE_FORM_CEX as TradingExchangeFormType,
            [TRADING_EXCHANGE_COMPARATOR_KYC_FILTER]:
                TRADING_EXCHANGE_COMPARATOR_KYC_FILTER_ALL as TradingExchangeKycFilter,
            [TRADING_EXCHANGE_COMPARATOR_RATE_FILTER]:
                TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL as TradingExchangeRateFilter,
        }),
        [defaultFormState, defaultSendCryptoSelect, defaultReceiveCryptoSelect],
    );

    return { defaultValues, defaultCurrency };
};
