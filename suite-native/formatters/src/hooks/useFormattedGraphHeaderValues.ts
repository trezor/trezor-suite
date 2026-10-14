import { useSelector } from 'react-redux';

import { useCurrencyAmountParts } from '@suite-common/formatters';
import { selectLocale } from '@suite-native/intl';

export const useFormattedGraphHeaderValues = (value: string = '0') => {
    const locale = useSelector(selectLocale);

    return useCurrencyAmountParts({ value, locale });
};
