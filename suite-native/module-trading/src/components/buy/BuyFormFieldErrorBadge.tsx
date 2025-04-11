import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';

import { TradingBuyFormValues } from '../../types';

export type BuyFormFieldErrorBadgeProps = {
    fieldName: keyof TradingBuyFormValues;
};

export const BuyFormFieldErrorBadge = ({ fieldName }: BuyFormFieldErrorBadgeProps) => {
    const { errorMessage, hasError } = useField({ name: fieldName });

    if (!hasError) {
        return null;
    }

    return <Badge label={errorMessage} variant="red" size="small" />;
};
