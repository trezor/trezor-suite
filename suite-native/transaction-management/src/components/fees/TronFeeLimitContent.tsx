import { useEffect } from 'react';

import { VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { integerTransformer } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';

import { type FeesFormValues } from '../../feesFormSchema';
import { FEE_LIMIT_FIELD_NAME } from '../../presets';

type TronFeeLimitContentProps = {
    estimatedFeeLimit: string | undefined;
    onSubmittableChange: (isSubmittable: boolean) => void;
};

export const TronFeeLimitContent = ({
    estimatedFeeLimit,
    onSubmittableChange,
}: TronFeeLimitContentProps) => {
    const { translate } = useTranslate();
    const {
        formState: { isValid },
        setValue,
        getValues,
        trigger,
    } = useFormContext<FeesFormValues>();
    const debounce = useDebounce();

    useEffect(() => {
        const currentValue = getValues(FEE_LIMIT_FIELD_NAME);
        if (!currentValue && estimatedFeeLimit) {
            setValue(FEE_LIMIT_FIELD_NAME, estimatedFeeLimit, { shouldDirty: false });
            trigger(FEE_LIMIT_FIELD_NAME);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        onSubmittableChange(isValid);
    }, [isValid, onSubmittableChange]);

    const handleChange = (value: string) => {
        const transformed = integerTransformer(value);
        setValue(FEE_LIMIT_FIELD_NAME, transformed);
        debounce(() => trigger(FEE_LIMIT_FIELD_NAME));
    };

    return (
        <VStack spacing="sp8">
            <TextInputField
                label={translate('transactionManagement.fees.tron.feeLimit')}
                name={FEE_LIMIT_FIELD_NAME}
                keyboardType="number-pad"
                onChangeText={handleChange}
            />
        </VStack>
    );
};
