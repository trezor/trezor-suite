import { useEffect } from 'react';

import { VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { integerTransformer } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';

import { type FeesFormValues } from '../../feesFormSchema';
import { FEE_LIMIT_FIELD_NAME } from '../../presets';

type TronFeeLimitContentProps = {
    onSubmittableChange: (isSubmittable: boolean) => void;
};

export const TronFeeLimitContent = ({ onSubmittableChange }: TronFeeLimitContentProps) => {
    const { translate } = useTranslate();
    const {
        formState: { isValid },
        setValue,
        trigger,
    } = useFormContext<FeesFormValues>();
    const debounce = useDebounce();

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
