import { useCallback, useEffect, useEffectEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    SLIPPAGE_PRESETS,
    type SlippageFormValues,
    selectTradingExchangeSelectedQuoteSwapSlippage,
    tradingExchangeActions,
} from '@suite-common/trading';
import {
    BottomSheetModal,
    Box,
    Button,
    HStack,
    Text,
    TextButton,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { decimalTransformer } from '@suite-native/helpers';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { TREZOR_TRADING_DEX_SLIPPAGE_URL } from '@trezor/urls';

import { SlippageSummary } from './SlippageSummary';
import { useSlippageForm } from '../hooks/useSlippageForm';

type SlippageBottomSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onSlippageConfirmed: () => Promise<void>;
};

export const SlippageBottomSheet = ({
    isVisible,
    onClose,
    onSlippageConfirmed,
}: SlippageBottomSheetProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const openLink = useOpenLink();

    const currentSlippage = useSelector(selectTradingExchangeSelectedQuoteSwapSlippage);
    const { handleSubmit, isSubmitting, isValid, handlePresetPress, form } =
        useSlippageForm(currentSlippage);

    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const { reset } = form;
    const resetForm = useEffectEvent(() => {
        reset({ slippage: currentSlippage });
    });

    useEffect(() => {
        if (isVisible) {
            resetForm();
            openModal();
        }
    }, [isVisible, openModal]);

    const handleConfirm = useCallback(
        async ({ slippage }: SlippageFormValues) => {
            dispatch(tradingExchangeActions.setSelectedQuoteSwapSlippage(String(slippage)));
            await onSlippageConfirmed();
            closeModal();
            onClose();
        },
        [closeModal, dispatch, onClose, onSlippageConfirmed],
    );

    const handleCancel = useCallback(() => {
        closeModal();
        onClose();
    }, [closeModal, onClose]);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            title={<Translation id="moduleTrading.slippage.title" />}
            onDismiss={onClose}
            isCloseDisplayed
        >
            <Form form={form}>
                <VStack spacing="sp24" paddingBottom="sp24">
                    <Text>
                        <Translation id="moduleTrading.slippage.description" />
                    </Text>
                    <VStack spacing="sp8">
                        <TextInputField
                            name="slippage"
                            rightIcon={<Icon name="percent" />}
                            keyboardType="numeric"
                            valueTransformer={decimalTransformer}
                            asBottomSheetInput
                            accessibilityLabel={translate('moduleTrading.slippage.inputLabel')}
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
                    <SlippageSummary />
                    <Box alignSelf="flex-start">
                        <TextButton
                            onPress={() => openLink(TREZOR_TRADING_DEX_SLIPPAGE_URL)}
                            iconRight="arrowUpRight"
                            intent="brand"
                            isUnderlined
                        >
                            <Translation id="generic.buttons.learnMore" />
                        </TextButton>
                    </Box>
                    <VStack spacing="sp12">
                        <Button
                            intent="brand"
                            priority="primary"
                            isFullWidth
                            isLoading={isSubmitting}
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
