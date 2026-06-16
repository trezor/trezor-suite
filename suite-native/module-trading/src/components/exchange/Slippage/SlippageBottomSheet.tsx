import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    SLIPPAGE_PRESETS,
    type SlippageFormValues,
    tradingSettingsActions,
} from '@suite-common/trading';
import {
    BottomSheetModal,
    Button,
    HStack,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { decimalTransformer } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';

import { SlippageSummary } from './SlippageSummary';
import { useSlippageForm } from '../../../hooks/Slippage/useSlippageForm';

type SlippageBottomSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    quote?: ExchangeTrade;
};

export const SlippageBottomSheet = ({ isVisible, onClose, quote }: SlippageBottomSheetProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const { form, isValid, handlePresetPress } = useSlippageForm();

    const { handleSubmit, reset } = form;

    useEffect(() => {
        if (isVisible) {
            openModal();
        }
    }, [isVisible, openModal]);

    const handleConfirm = useCallback(
        ({ slippage }: SlippageFormValues) => {
            dispatch(tradingSettingsActions.setMaxSlippagePercentage(String(slippage)));
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
                            name="slippage"
                            rightIcon={<Text>%</Text>}
                            keyboardType="numeric"
                            valueTransformer={decimalTransformer}
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
