import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Button, VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext, useFormState, useWatch } from '@suite-native/forms';
import { integerTransformer } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';

import { type FeesFormValues } from '../../feesFormSchema';
import { getReferenceFeeLevel } from '../../hooks/fees/referenceFeeLevel';
import { FEE_LIMIT_FIELD_NAME } from '../../presets';
import { selectFeeLevels } from '../../selectors';

type TronFeeLimitContentProps = {
    onSubmittableChange: (isSubmittable: boolean) => void;
};

export const TronFeeLimitContent = ({ onSubmittableChange }: TronFeeLimitContentProps) => {
    const { translate } = useTranslate();
    const { control, setValue, trigger } = useFormContext<FeesFormValues>();
    const { isValid } = useFormState({ control });
    const feeLimit = useWatch({ control, name: FEE_LIMIT_FIELD_NAME });
    const feeLevels = useSelector(selectFeeLevels);
    const debounce = useDebounce();

    const estimatedFeeLimit = getReferenceFeeLevel(feeLevels)?.estimatedFeeLimit;
    const isUseRecommendedVisible = !!estimatedFeeLimit && feeLimit !== estimatedFeeLimit;

    useEffect(() => {
        onSubmittableChange(isValid);
    }, [isValid, onSubmittableChange]);

    const handleChange = (value: string) => {
        const transformed = integerTransformer(value);
        setValue(FEE_LIMIT_FIELD_NAME, transformed);
        debounce(() => trigger(FEE_LIMIT_FIELD_NAME));
    };

    const handleUseRecommended = () => {
        setValue(FEE_LIMIT_FIELD_NAME, estimatedFeeLimit, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    return (
        <VStack spacing="sp8">
            <TextInputField
                label={translate('transactionManagement.fees.tron.feeLimit')}
                name={FEE_LIMIT_FIELD_NAME}
                keyboardType="number-pad"
                onChangeText={handleChange}
            />
            {isUseRecommendedVisible && (
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    isFullWidth
                    onPress={handleUseRecommended}
                    testID="@transactionManagement/tron-fee-limit-use-recommended"
                >
                    <Translation id="transactionManagement.fees.tron.useRecommended" />
                </Button>
            )}
        </VStack>
    );
};
