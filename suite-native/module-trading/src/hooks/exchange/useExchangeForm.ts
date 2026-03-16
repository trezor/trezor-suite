import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { CryptoId, ExchangeTrade } from 'invity-api';

import {
    type TradingExchangeAmountLimitProps,
    selectTradingExchangeProviders,
    selectTradingExchangeQuotesRequest,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { events } from '@suite-native/analytics';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import {
    exchangeActions,
    selectExchangeAmountLimits,
    selectExchangeQuotes,
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
    selectGroupedExchangeQuotes,
} from '@suite-native/trading-state';
import { type ExchangeFormType, type ExchangeFormValues } from '@suite-native/trading-types';

import { exchangeFormValidationSchema } from '../../utils/exchange/exchangeFormValidationSchema';
import { useContextForTradingForm } from '../general/form/useContextForTradingForm';
import { useProviderMetadataChangeEffect } from '../general/form/useProviderMetadataChangeEffect';
import { useReceiveAccountChangeEffect } from '../general/form/useReceiveAccountChangeEffect';
import { useSendAccountAssetBalance } from '../general/form/useSendAccountAssetBalance';
import { useSendAccountChangeEffect } from '../general/form/useSendAccountChangeEffect';

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
            if (quoteGroups.fixed.length > 0 && quoteGroups.float.length > 0) {
                const fixedQuote = quoteGroups.fixed[0];
                const floatQuote = quoteGroups.float[0];
                const fixedQuoteRate = fixedQuote?.rate ?? 0;
                const floatQuoteRate = floatQuote?.rate ?? 0;
                bestQuote = fixedQuoteRate >= floatQuoteRate ? fixedQuote : floatQuote;
            } else if (quoteGroups.fixed.length > 0) {
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
            setValue('receiveCryptoAmount', undefined, { shouldValidate: true });

            return;
        }

        const value =
            isAmountInSats && amount && symbol
                ? convertAmountUnitsToSubunits(amount, getNetwork(symbol).decimals)
                : amount;
        setValue('receiveCryptoAmount', value, { shouldValidate: true });
    }, [selectedQuote, isAmountInSats, symbol, setValue]);
};

const useAmountAndCurrencyFieldsChangeEffect = ({ setValue, watch }: ExchangeFormType) => {
    const dispatch = useDispatch();
    const prevSendCryptoId = useRef<CryptoId | undefined>(undefined);
    const prevReceiveCryptoId = useRef<CryptoId | undefined>(undefined);
    const analytics = useAnalytics();

    useEffect(() => {
        const { unsubscribe } = watch(({ sendAsset, receiveAsset }, { name }) => {
            switch (name) {
                case 'sendAsset':
                    if (sendAsset?.cryptoId !== prevSendCryptoId.current) {
                        analytics.report({
                            type: events.tradingParameterChangedEvent.name,
                            payload: {
                                type: 'exchange',
                                parameter: 'cryptoFrom',
                            },
                        });

                        prevSendCryptoId.current = sendAsset?.cryptoId as CryptoId | undefined;
                        setValue('sendCryptoAmount', undefined, { shouldValidate: true });
                        if (sendAsset?.cryptoId === receiveAsset?.cryptoId) {
                            setValue('receiveAsset', undefined);
                        }
                        dispatch(exchangeActions.sendAssetChanged());
                    }
                    break;

                case 'receiveAsset':
                    if (receiveAsset?.cryptoId !== prevReceiveCryptoId.current) {
                        analytics.report({
                            type: events.tradingParameterChangedEvent.name,
                            payload: {
                                type: 'exchange',
                                parameter: 'cryptoTo',
                            },
                        });

                        prevReceiveCryptoId.current = receiveAsset?.cryptoId as
                            | CryptoId
                            | undefined;
                        dispatch(exchangeActions.receiveAssetChanged());
                    }
                    break;

                default:
                // do nothing
            }
        });

        return unsubscribe;
    }, [setValue, watch, dispatch, analytics]);
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
    const { context, setBalance, setSendSymbol, setContractAddress } =
        useContextForTradingForm(limits);

    const form = useForm<ExchangeFormValues>({
        validation: exchangeFormValidationSchema,
        context,
    });
    const { setValue, watch } = form;

    useExchangeQuotesChangeEffect(form);
    useExchangeQuoteChangeEffect(form);
    useSendAccountChangeEffect(setValue, selectExchangeSelectedSendAccount);
    useReceiveAccountChangeEffect(setValue, selectExchangeSelectedReceiveAccount);
    useAmountAndCurrencyFieldsChangeEffect(form);
    useSendAccountAssetBalance(form, setBalance, setSendSymbol, setContractAddress);
    useValidations(form, limits);
    useProviderMetadataChangeEffect(watch, 'exchange');

    return form;
};

export const clearExchangeFormQuoteData = (form: ExchangeFormType) => {
    form.setValue('quote', undefined);
    form.setValue('sendCryptoAmount', undefined, { shouldValidate: true });
    form.setValue('receiveCryptoAmount', undefined, { shouldValidate: true });
    form.setValue('generalAlert', undefined);
};
