import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { selectSellAmountLimits, selectSellFormDefaultValues } from '../../selectors/sellSelectors';
import { SellFormContext, SellFormType, SellFormValues } from '../../types/sell';
import { sellFormValidationSchema } from '../../utils/sell/sellFormValidationSchema';
import { useConvertFormValueToBaseUnit } from '../general/useConvertFormValueToBaseUnit';

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

    return useForm<SellFormValues>({
        defaultValues,
        validation: sellFormValidationSchema,
        context,
    });
};
