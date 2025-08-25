import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CryptoId, FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import {
    TradingAmountLimitProps,
    getBestRatedQuote,
    selectTradingSellQuotesRequest,
    selectValidTradingSellQuotes,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    WalletSettingsRootState,
    selectIsAmountInSats,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@suite-native/analytics';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { MAX_CRYPTO_DECIMALS, MAX_FIAT_DECIMALS } from '../../consts/general/consts';
import { sellActions } from '../../reducers';
import {
    selectSellAmountLimits,
    selectSellFormDefaultValues,
    selectSellSelectedSendAccount,
} from '../../selectors/sellSelectors';
import { SellFormType, SellFormValues } from '../../types/sell';
import { truncateDecimals } from '../../utils/general/amountUtils';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { sellFormValidationSchema } from '../../utils/sell/sellFormValidationSchema';
import { useContextForTradingForm } from '../general/form/useContextForTradingForm';
import { useSendAccountAssetBalance } from '../general/form/useSendAccountAssetBalance';

const useSendAccountChangeEffect = ({ setValue }: SellFormType) => {
    const sendAccount = useSelector(selectSellSelectedSendAccount);

    useEffect(() => {
        setValue('sendAccount', sendAccount);
    }, [sendAccount, setValue]);
};

const useSelectedDeviceChangeEffect = ({ setValue }: SellFormType) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const unqDeviceIdentifier = selectedDevice?.state?.staticSessionId;

    useEffect(() => {
        setValue('sendAsset', undefined, { shouldValidate: true });
    }, [unqDeviceIdentifier, setValue]);
};

const useAmountAndCurrencyFieldsChangeEffect = ({ setValue, getValues, watch }: SellFormType) => {
    const dispatch = useDispatch();
    const prevCryptoId = useRef<CryptoId | undefined>(undefined);
    const prevFiatCurrency = useRef<FiatCurrencyCode | undefined>(getValues('fiatCurrency'));

    useEffect(() => {
        const { unsubscribe } = watch(
            ({ fiatCurrency, sendAsset, amountInCrypto, focusedValue }, { name, type }) => {
                switch (name) {
                    case 'fiatStringAmount':
                        if (type === 'change' && focusedValue === 'fiatStringAmount') {
                            setValue('cryptoStringAmount', undefined, { shouldValidate: true });
                            if (amountInCrypto) {
                                setValue('amountInCrypto', false);
                            }
                        }
                        break;

                    case 'cryptoStringAmount':
                        if (type === 'change' && focusedValue === 'cryptoStringAmount') {
                            setValue('fiatStringAmount', undefined, { shouldValidate: true });
                            if (!amountInCrypto) {
                                setValue('amountInCrypto', true);
                            }
                        }
                        break;

                    case 'sendAsset':
                        if (sendAsset?.cryptoId !== prevCryptoId.current) {
                            analytics.report({
                                type: EventType.TradingParameterChanged,
                                payload: {
                                    type: 'sell',
                                    parameter: 'cryptoFrom',
                                },
                            });
                            prevCryptoId.current = sendAsset?.cryptoId as CryptoId | undefined;
                            setValue('cryptoStringAmount', undefined, { shouldValidate: true });
                            dispatch(sellActions.sendAssetChanged());
                        }
                        break;

                    case 'fiatCurrency':
                        if (fiatCurrency !== prevFiatCurrency.current) {
                            analytics.report({
                                type: EventType.TradingParameterChanged,
                                payload: {
                                    type: 'sell',
                                    parameter: 'fiat',
                                },
                            });
                            prevFiatCurrency.current = fiatCurrency;
                            setValue('fiatStringAmount', undefined, { shouldValidate: true });
                            dispatch(sellActions.fiatCurrencyChanged());
                        }
                        break;

                    default:
                        // do nothing
                        break;
                }
            },
        );

        return unsubscribe;
    }, [setValue, watch, dispatch]);
};

const useSellQuotesChangeEffect = ({ getValues, setValue }: SellFormType) => {
    const quotes = useSelector(selectValidTradingSellQuotes);

    useEffect(() => {
        if (quotes.length === 0) {
            setValue('quote', undefined);

            return;
        }

        const currentQuote = getValues('quote');
        let quoteCandidates: SellFiatTrade[] = [];

        if (currentQuote) {
            quoteCandidates = quotes.filter(
                ({ paymentMethod, exchange }) =>
                    paymentMethod === currentQuote.paymentMethod &&
                    exchange === currentQuote.exchange,
            );

            if (quoteCandidates.length === 0) {
                quoteCandidates = quotes.filter(
                    ({ paymentMethod }) => paymentMethod === currentQuote.paymentMethod,
                );
            }
        }

        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes.filter(
                ({ paymentMethod }) => paymentMethod === 'bankTransfer',
            );
        }

        if (quoteCandidates.length === 0) {
            quoteCandidates = quotes;
        }

        const selectedQuote = getBestRatedQuote(quoteCandidates, 'sell');
        setValue('quote', selectedQuote);
    }, [quotes, getValues, setValue]);
};

const useSellQuoteChangeEffect = ({ getValues, setValue, watch }: SellFormType) => {
    const [sendAsset, quote] = watch(['sendAsset', 'quote']);
    const symbol = getSymbolFromTradeableAsset(sendAsset);

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const [amountInCrypto, fiatValue, cryptoValue] = getValues([
            'amountInCrypto',
            'fiatStringAmount',
            'cryptoStringAmount',
        ]);
        const truncatedFiatAmount = truncateDecimals(quote?.fiatStringAmount, MAX_FIAT_DECIMALS);

        const truncatedCryptoAmount = truncateDecimals(
            quote?.cryptoStringAmount,
            MAX_CRYPTO_DECIMALS,
        );

        if (amountInCrypto && fiatValue !== truncatedFiatAmount) {
            setValue('fiatStringAmount', truncatedFiatAmount);
        }

        if (!amountInCrypto && cryptoValue !== truncatedCryptoAmount) {
            const value =
                isAmountInSats && truncatedCryptoAmount && symbol
                    ? convertAmountUnitsToSubunits(
                          truncatedCryptoAmount,
                          getNetwork(symbol).decimals,
                      )
                    : truncatedCryptoAmount;
            setValue('cryptoStringAmount', value);
        }
    }, [quote, isAmountInSats, symbol, getValues, setValue]);
};

const useValidations = (
    { trigger, setValue }: SellFormType,
    limits: TradingAmountLimitProps | undefined,
) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectValidTradingSellQuotes);
    const quoteRequest = useSelector(selectTradingSellQuotesRequest);

    const generalAlertMsg =
        !quoteRequest || quotes.length > 0 || limits
            ? undefined
            : translate('moduleTrading.validators.noQuotes');

    useEffect(() => {
        trigger(['cryptoStringAmount', 'fiatStringAmount']);
    }, [limits, trigger]);

    useEffect(() => {
        setValue('generalAlert', generalAlertMsg);
    }, [generalAlertMsg, setValue]);
};

export const useSellForm = (): SellFormType => {
    const defaultValues = useSelector(selectSellFormDefaultValues);
    const limits = useSelector(selectSellAmountLimits);
    const { context, setBalance, setSendSymbol } = useContextForTradingForm(limits);

    const form = useForm<SellFormValues>({
        defaultValues,
        validation: sellFormValidationSchema,
        context,
    });

    useSendAccountChangeEffect(form);
    useSelectedDeviceChangeEffect(form);
    useAmountAndCurrencyFieldsChangeEffect(form);
    useSendAccountAssetBalance(form, setBalance, setSendSymbol);
    useSellQuotesChangeEffect(form);
    useSellQuoteChangeEffect(form);
    useValidations(form, limits);

    return form;
};
