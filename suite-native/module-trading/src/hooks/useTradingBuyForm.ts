import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { yup } from '@suite-common/validators';
import { useForm } from '@suite-native/forms';

import {
    selectBuyFormDefaultValues,
    selectBuySelectedReceiveAccount,
} from '../selectors/buySelectors';
import { setBuySelectedReceiveAccount } from '../tradingSlice';
import { TradingBuyForm, TradingBuyFormValues } from '../types';

const buyFormValidationSchema = yup.object({});

const useAssetChangeEffect = (form: TradingBuyForm) => {
    const dispatch = useDispatch();

    const asset = form.watch('asset');

    useEffect(() => {
        form.setValue('cryptoValue', undefined);
    }, [form, asset]);

    useEffect(() => {
        if (asset?.cryptoId !== undefined) {
            dispatch(setBuySelectedReceiveAccount({ selectedReceiveAccount: undefined }));
        }
    }, [dispatch, asset?.cryptoId]);
};

const useReceiveAccountChangeEffect = (form: TradingBuyForm) => {
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    useEffect(() => {
        form.setValue('receiveAccount', selectedReceiveAccount);
    }, [form, selectedReceiveAccount]);
};

const useFiatCurrencyChangeEffect = (form: TradingBuyForm) => {
    const fiatCurrency = form.watch('fiatCurrency');

    useEffect(() => {
        form.setValue('cryptoValue', undefined);
        form.setValue('fiatValue', undefined);
    }, [form, fiatCurrency]);
};

const useFiatValueChangeEffect = (form: TradingBuyForm) => {
    const fiatValue = form.watch('fiatValue');

    useEffect(() => {
        if (form.getValues('focusedValue') === 'fiatValue') {
            form.setValue('cryptoValue', undefined);
        }
    }, [form, fiatValue]);
};

const useCryptoValueChangeEffect = (form: TradingBuyForm) => {
    const cryptoValue = form.watch('cryptoValue');

    useEffect(() => {
        if (form.getValues('focusedValue') === 'cryptoValue') {
            form.setValue('fiatValue', undefined);
        }
    }, [form, cryptoValue]);
};

export const useTradingBuyForm = (): TradingBuyForm => {
    const defaultValues = useSelector(selectBuyFormDefaultValues);

    const form = useForm<TradingBuyFormValues>({
        defaultValues,
        validation: buyFormValidationSchema,
    });

    useAssetChangeEffect(form);
    useReceiveAccountChangeEffect(form);
    useFiatCurrencyChangeEffect(form);
    useFiatValueChangeEffect(form);
    useCryptoValueChangeEffect(form);

    return form;
};
