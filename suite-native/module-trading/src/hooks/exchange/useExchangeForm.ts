import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { ExchangeTrade } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    TradingExchangeAmountLimitProps,
    selectTradingExchangeProviders,
    selectTradingExchangeQuotesRequest,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    TransactionsRootState,
    WalletSettingsRootState,
    selectAccountFormattedBalance,
    selectIsAmountInSats,
} from '@suite-common/wallet-core';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { selectAccountTokenBalance } from '@suite-native/tokens';

import {
    selectExchangeAmountLimits,
    selectExchangeQuotes,
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
    selectGroupedExchangeQuotes,
} from '../../selectors/exchangeSelectors';
import { ExchangeFormContext, ExchangeFormType, ExchangeFormValues } from '../../types/exchange';
import { exchangeFormValidationSchema } from '../../utils/exchange/exchangeFormValidationSchema';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { useConvertFormValueToBaseUnit } from '../general/useConvertFormValueToBaseUnit';

const useExchangeQuotesChangeEffect = ({ getValues, setValue }: ExchangeFormType) => {
    const providers = useSelector(selectTradingExchangeProviders);
    const quoteGroups = useSelector(selectGroupedExchangeQuotes);

    useEffect(() => {
        const setQuote = (quote: ExchangeTrade | undefined) => setValue('quote', quote);

        const currentQuote = getValues('quote');

        let bestQuote: ExchangeTrade | undefined;

        if (currentQuote) {
            const { exchange = '', isDex } = currentQuote;
            const { isFixedRate } = providers?.[exchange] || {};

            let candidateQuotes: ExchangeTrade[];

            if (isDex) {
                candidateQuotes = quoteGroups.dex;
            } else if (isFixedRate) {
                candidateQuotes = quoteGroups.fixed;
            } else {
                candidateQuotes = quoteGroups.float;
            }

            bestQuote = candidateQuotes.find(quote => quote.exchange === exchange);

            if (!bestQuote) {
                bestQuote = candidateQuotes[0];
            }
        }

        if (!bestQuote) {
            if (quoteGroups.fixed.length > 0) {
                bestQuote = quoteGroups.fixed[0];
            } else if (quoteGroups.float.length > 0) {
                bestQuote = quoteGroups.float[0];
            } else if (quoteGroups.dex.length > 0) {
                bestQuote = quoteGroups.dex[0];
            }
        }

        setQuote(bestQuote);
    }, [providers, quoteGroups, setValue, getValues]);
};

const useExchangeQuoteChangeEffect = ({ watch, setValue }: ExchangeFormType) => {
    const [selectedQuote, receiveAsset] = watch(['quote', 'receiveAsset']);
    const symbol = getSymbolFromTradeableAsset(receiveAsset);

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const amount = selectedQuote?.receiveStringAmount;
        if (!amount) {
            setValue('receiveCryptoAmount', undefined);

            return;
        }

        const value =
            isAmountInSats && amount && symbol
                ? convertAmountUnitsToSubunits(amount, getNetwork(symbol).decimals)
                : amount;
        setValue('receiveCryptoAmount', value);
    }, [selectedQuote, isAmountInSats, symbol, setValue]);
};

const useSendAccountChangeEffect = ({ setValue }: ExchangeFormType) => {
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    useEffect(() => {
        setValue('sendAccount', sendAccount);
    }, [sendAccount, setValue]);
};

const useReceiveAccountChangeEffect = ({ setValue }: ExchangeFormType) => {
    const receiveAccount = useSelector(selectExchangeSelectedReceiveAccount);

    useEffect(() => {
        setValue('receiveAccount', receiveAccount);
    }, [receiveAccount, setValue]);
};

const useSendAccountAssetBalance = (
    { watch }: ExchangeFormType,
    setBalance: (balance: string | null) => unknown,
    setCurrency: (currency: string | undefined) => unknown,
) => {
    const [sendAccount, sendAsset] = watch(['sendAccount', 'sendAsset']);
    const accountKey = sendAccount?.key;
    const tokenAddress = sendAsset?.contractAddress;

    const balance = useSelector(
        (
            state: AccountsRootState &
                DeviceRootState &
                TokenDefinitionsRootState &
                TransactionsRootState,
        ) =>
            tokenAddress
                ? selectAccountTokenBalance(state, accountKey, tokenAddress)
                : selectAccountFormattedBalance(state, accountKey),
    );

    useEffect(() => {
        setBalance(balance);
    }, [setBalance, balance]);

    useEffect(() => {
        setCurrency(sendAsset?.symbol);
    }, [setCurrency, sendAsset]);
};

const useContextForExchangeForm = (
    balance: string | null,
    currency: string | undefined,
    limits: TradingExchangeAmountLimitProps | undefined,
): ExchangeFormContext => {
    const { translate } = useTranslate();
    const { CryptoAmountFormatter } = useFormatters();
    const { convertNumberToBaseUnit } = useConvertFormValueToBaseUnit();

    return {
        ...limits,
        currency,
        translate,
        balance: balance || undefined,
        CryptoAmountFormatter,
        convertNumberToBaseUnit,
    };
};

const useValidations = (
    { trigger, setValue }: ExchangeFormType,
    limits: TradingExchangeAmountLimitProps | undefined,
) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectExchangeQuotes);
    const quoteRequest = useSelector(selectTradingExchangeQuotesRequest);

    const generalAlertMsg =
        !quoteRequest || quotes.length > 0 || limits
            ? undefined
            : translate('moduleTrading.validators.noQuotes');

    useEffect(() => {
        trigger(['sendCryptoAmount']);
    }, [limits, trigger]);

    useEffect(() => {
        setValue('generalAlert', generalAlertMsg);
    }, [generalAlertMsg, setValue]);
};

export const useExchangeForm = () => {
    const limits = useSelector(selectExchangeAmountLimits);

    const [balance, setBalance] = useState<string | null>(null);
    const [currency, setCurrency] = useState<string | undefined>(undefined);
    const context = useContextForExchangeForm(balance, currency, limits);

    const form = useForm<ExchangeFormValues>({
        validation: exchangeFormValidationSchema,
        context,
    });

    useExchangeQuotesChangeEffect(form);
    useExchangeQuoteChangeEffect(form);
    useSendAccountChangeEffect(form);
    useReceiveAccountChangeEffect(form);
    useSendAccountAssetBalance(form, setBalance, setCurrency);
    useValidations(form, limits);

    return form;
};

export const clearExchangeFormQuoteData = (form: ExchangeFormType) => {
    form.setValue('quote', undefined);
    form.setValue('sendCryptoAmount', undefined, { shouldValidate: true });
    form.setValue('receiveCryptoAmount', undefined, { shouldValidate: true });
    form.setValue('generalAlert', undefined);
};
