import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CryptoId, FiatCurrencyCode } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    TradingAmountLimitProps,
    TradingExchangeAmountLimitProps,
    selectTradingSellQuotesRequest,
} from '@suite-common/trading';
import {
    AccountsRootState,
    DeviceRootState,
    TransactionsRootState,
    selectAccountFormattedBalance,
} from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { selectAccountTokenBalance } from '@suite-native/tokens';

import { sellActions } from '../../reducers';
import {
    selectSellAmountLimits,
    selectSellFormDefaultValues,
    selectSellQuotes,
    selectSellSelectedSendAccount,
} from '../../selectors/sellSelectors';
import { SellFormContext, SellFormType, SellFormValues } from '../../types/sell';
import { sellFormValidationSchema } from '../../utils/sell/sellFormValidationSchema';
import { useConvertFormValueToBaseUnit } from '../general/useConvertFormValueToBaseUnit';

const useSendAccountChangeEffect = ({ setValue }: SellFormType) => {
    const sendAccount = useSelector(selectSellSelectedSendAccount);

    useEffect(() => {
        setValue('sendAccount', sendAccount);
    }, [sendAccount, setValue]);
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

const useValidations = (
    { trigger, setValue }: SellFormType,
    limits: TradingAmountLimitProps | undefined,
) => {
    const { translate } = useTranslate();
    const quotes = useSelector(selectSellQuotes);
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

const useContextForSellForm = (limits: TradingExchangeAmountLimitProps | undefined) => {
    const { translate } = useTranslate();
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { convertNumberToBaseUnit } = useConvertFormValueToBaseUnit();

    const [balance, setBalance] = useState<string | null>(null);
    const [sendSymbol, setSendSymbol] = useState<string | undefined>(undefined);

    const context: SellFormContext = {
        ...limits,
        sendSymbol,
        translate,
        balance: balance || undefined,
        FiatAmountFormatter: BaseCurrencyAmountFormatter,
        CryptoAmountFormatter,
        convertNumberToBaseUnit,
    };

    return {
        context,
        setBalance,
        setSendSymbol,
    };
};

const useSendAccountAssetBalance = (
    { watch }: SellFormType,
    setBalance: (balance: string | null) => unknown,
    setSendSymbol: (currency: string | undefined) => unknown,
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
        setSendSymbol(sendAsset?.symbol);
    }, [setSendSymbol, sendAsset]);
};

export const useSellForm = (): SellFormType => {
    const defaultValues = useSelector(selectSellFormDefaultValues);
    const limits = useSelector(selectSellAmountLimits);
    const { context, setBalance, setSendSymbol } = useContextForSellForm(limits);

    const form = useForm<SellFormValues>({
        defaultValues,
        validation: sellFormValidationSchema,
        context,
    });

    useSendAccountChangeEffect(form);
    useAmountAndCurrencyFieldsChangeEffect(form);
    useSendAccountAssetBalance(form, setBalance, setSendSymbol);
    useValidations(form, limits);

    return form;
};
