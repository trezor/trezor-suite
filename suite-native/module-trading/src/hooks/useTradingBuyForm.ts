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
import { getSelectedSymbolFromBuyForm } from '../utils/tradeableAssetUtils';

const buyFormValidationSchema = yup.object({});

export const useTradingBuyForm = (): TradingBuyForm => {
    const dispatch = useDispatch();

    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);
    const defaultValues = useSelector(selectBuyFormDefaultValues);

    const form = useForm<TradingBuyFormValues>({
        defaultValues,
        validation: buyFormValidationSchema,
    });

    const selectedNetworkSymbol = getSelectedSymbolFromBuyForm(form);

    useEffect(() => {
        if (selectedNetworkSymbol !== undefined) {
            dispatch(setBuySelectedReceiveAccount({ selectedReceiveAccount: undefined }));
        }
    }, [dispatch, selectedNetworkSymbol]);

    useEffect(() => {
        form.setValue('receiveAccount', selectedReceiveAccount);
    }, [form, selectedReceiveAccount]);

    return form;
};
