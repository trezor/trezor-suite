import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { tradingSettingsActions } from '@suite-common/trading';
import { Button, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { decimalTransformer } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { type MaxSlippageFormValues } from '@suite-native/trading-types';

import { useMaxSlippageForm } from '../../hooks/settings/useMaxSlippageForm';

export type MaxSlippageFormProps = {
    onSubmit: () => void;
};

export const SLIPPAGE_INPUT_TEST_ID = 'max-slippage-input';

export const MaxSlippageForm = ({ onSubmit }: MaxSlippageFormProps) => {
    const { translate } = useTranslate();
    const dispatch = useDispatch();

    const form = useMaxSlippageForm();
    const {
        formState: { isValid, isSubmitting },
        handleSubmit,
        reset,
        trigger,
    } = form;

    const submitForm = useCallback(
        ({ maxSlippage }: MaxSlippageFormValues) => {
            dispatch(tradingSettingsActions.setMaxSlippagePercentage(String(maxSlippage)));
            onSubmit();
            reset();
        },
        [dispatch, onSubmit, reset],
    );

    const forceValidation = useCallback(() => trigger('maxSlippage'), [trigger]);

    return (
        <VStack justifyContent="space-between" spacing="sp24" paddingBottom="sp24">
            <Text>
                <Translation id="moduleTrading.advancedSettings.slippage.description" />
            </Text>
            <Form form={form}>
                <TextInputField
                    name="maxSlippage"
                    rightIcon={<Text>%</Text>}
                    label={translate('moduleTrading.advancedSettings.slippage.inputLabel')}
                    testID={SLIPPAGE_INPUT_TEST_ID}
                    keyboardType="numeric"
                    valueTransformer={decimalTransformer}
                    onChangeText={forceValidation}
                    asBottomSheetInput
                />
                <Button
                    intent="brand"
                    priority="primary"
                    isDisabled={!isValid}
                    isLoading={isSubmitting}
                    onPress={handleSubmit(submitForm)}
                >
                    <Translation id="moduleTrading.advancedSettings.slippage.confirm" />
                </Button>
            </Form>
        </VStack>
    );
};
