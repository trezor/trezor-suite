import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    SLIPPAGE_MAX,
    SLIPPAGE_MIN,
    SLIPPAGE_PRESETS,
    getSlippageFormValidationSchema,
    selectTradingMaxSlippagePercentage,
    tradingSettingsActions,
} from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import {
    BottomSheetModal,
    Button,
    HStack,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { decimalTransformer } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { type MaxSlippageFormValues } from '@suite-native/trading-types';

import { SlippageSummary } from './SlippageSummary';

type SlippageBottomSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    quote?: ExchangeTrade;
};

export const SlippageBottomSheet = ({ isVisible, onClose, quote }: SlippageBottomSheetProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const defaultMaxSlippage = useSelector(selectTradingMaxSlippagePercentage);

    const validationSchema = useMemo(
        () =>
            yup.object({
                maxSlippage: getSlippageFormValidationSchema({
                    required: translate(
                        'moduleTrading.advancedSettings.slippage.validation.required',
                    ),
                    notNumber: translate(
                        'moduleTrading.advancedSettings.slippage.validation.notNumber',
                    ),
                    outOfRange: translate(
                        'moduleTrading.advancedSettings.slippage.validation.outOfRange',
                        { min: SLIPPAGE_MIN, max: SLIPPAGE_MAX },
                    ),
                }),
            }),
        [translate],
    );

    const form = useForm<MaxSlippageFormValues>({
        defaultValues: { maxSlippage: defaultMaxSlippage },
        validation: validationSchema,
    });

    const {
        handleSubmit,
        setValue,
        trigger,
        reset,
        formState: { isValid },
    } = form;

    useEffect(() => {
        if (isVisible) {
            openModal();
        }
    }, [isVisible, openModal]);

    const handleConfirm = useCallback(
        ({ maxSlippage }: MaxSlippageFormValues) => {
            dispatch(tradingSettingsActions.setMaxSlippagePercentage(String(maxSlippage)));
            closeModal();
            onClose();
            reset();
        },
        [dispatch, closeModal, onClose, reset],
    );

    const handleCancel = useCallback(() => {
        closeModal();
        onClose();
        reset();
    }, [closeModal, onClose, reset]);

    const handlePresetPress = useCallback(
        (preset: string) => {
            setValue('maxSlippage', preset);
            void trigger('maxSlippage');
        },
        [setValue, trigger],
    );

    const forceValidation = useCallback(() => trigger('maxSlippage'), [trigger]);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            title={<Translation id="moduleTrading.advancedSettings.slippage.title" />}
            onDismiss={onClose}
        >
            <Form form={form}>
                <VStack spacing="sp24" paddingBottom="sp24">
                    <Text>
                        <Translation id="moduleTrading.advancedSettings.slippage.description" />
                    </Text>
                    <VStack spacing="sp8">
                        <TextInputField
                            name="maxSlippage"
                            rightIcon={<Text>%</Text>}
                            keyboardType="numeric"
                            valueTransformer={decimalTransformer}
                            onChangeText={forceValidation}
                            asBottomSheetInput
                            accessibilityLabel={translate(
                                'moduleTrading.advancedSettings.slippage.inputLabel',
                            )}
                        />
                        <HStack spacing="sp4">
                            {SLIPPAGE_PRESETS.map(preset => (
                                <Button
                                    key={preset}
                                    intent="neutral"
                                    priority="secondary"
                                    size="medium"
                                    flex={1}
                                    onPress={() => handlePresetPress(preset)}
                                >
                                    {preset}%
                                </Button>
                            ))}
                        </HStack>
                    </VStack>
                    {quote && <SlippageSummary quote={quote} />}
                    <VStack spacing="sp12">
                        <Button
                            intent="brand"
                            priority="primary"
                            isFullWidth
                            isDisabled={!isValid}
                            onPress={handleSubmit(handleConfirm)}
                        >
                            <Translation id="generic.buttons.confirm" />
                        </Button>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            isFullWidth
                            onPress={handleCancel}
                        >
                            <Translation id="generic.buttons.cancel" />
                        </Button>
                    </VStack>
                </VStack>
            </Form>
        </BottomSheetModal>
    );
};
