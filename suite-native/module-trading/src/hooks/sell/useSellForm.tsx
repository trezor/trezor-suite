import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CryptoId, FiatCurrencyCode } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { EventType, analytics } from '@suite-native/analytics';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { sellActions } from '../../reducers';
import {
    selectSellAmountLimits,
    selectSellFormDefaultValues,
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

export const useSellForm = (): SellFormType => {
    const { translate } = useTranslate();
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const defaultValues = useSelector(selectSellFormDefaultValues);
    const limits = useSelector(selectSellAmountLimits);
    const { convertNumberToBaseUnit } = useConvertFormValueToBaseUnit();

    const context: SellFormContext = {
        ...limits,
        translate,
        FiatAmountFormatter: BaseCurrencyAmountFormatter,
        CryptoAmountFormatter,
        convertNumberToBaseUnit,
    };

    const form = useForm<SellFormValues>({
        defaultValues,
        validation: sellFormValidationSchema,
        context,
    });

    useSendAccountChangeEffect(form);
    useAmountAndCurrencyFieldsChangeEffect(form);

    return form;
};
