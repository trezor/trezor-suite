import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

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

    return form;
};
