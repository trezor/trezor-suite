import { type YieldFlowStepId } from '@suite-common/wallet-core';
import {
    BottomSheetModal,
    Box,
    Button,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnModalStepIndicator } from './EarnModalStepIndicator';
import { yieldSupplyFlowSteps } from '../presets/yieldSupplyFlowPresets';

const stepCardStyle = prepareNativeStyle(utils => ({
    width: '100%',
    backgroundColor: utils.colors.surfaceFillRaised,
    borderTopWidth: utils.borders.widths.small,
    borderBottomWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
}));

const bottomSheetFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp24,
    paddingBottom: utils.spacings.sp16,
}));

type YieldSupplyStepCardProps = {
    currentStep?: YieldFlowStepId;
    isDisabled?: boolean;
};

export const YieldSupplyStepCard = ({
    currentStep: currentStepId = 'approve',
    isDisabled = false,
}: YieldSupplyStepCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const currentStep = yieldSupplyFlowSteps.find(({ stepId }) => stepId === currentStepId)!;
    const currentStepIndex = yieldSupplyFlowSteps.indexOf(currentStep);

    return (
        <>
            <PressableOpacity
                disabled={isDisabled}
                style={applyStyle(stepCardStyle)}
                onPress={openModal}
            >
                <HStack spacing="sp16" alignItems="center">
                    <VStack flex={1} spacing="sp2">
                        <Text variant="body-sm">
                            <Translation
                                id="earn.yieldSupplyFlowScreen.step"
                                values={{
                                    stepNumber: currentStepIndex + 1,
                                    stepCount: yieldSupplyFlowSteps.length,
                                }}
                            />
                        </Text>
                        <Text variant="body-md-strong">{currentStep.label}</Text>
                    </VStack>
                    <Icon name="caretUpDown" size="large" color="contentPrimary" />
                </HStack>
            </PressableOpacity>

            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="earn.yieldSupplyFlowScreen.modalTitle" />}
                footer={
                    <Box style={applyStyle(bottomSheetFooterStyle)}>
                        <Button onPress={closeModal}>
                            <Translation id="generic.buttons.gotIt" />
                        </Button>
                    </Box>
                }
                onClose={closeModal}
            >
                <EarnModalStepIndicator
                    currentStepIndex={currentStepIndex}
                    steps={yieldSupplyFlowSteps}
                />
            </BottomSheetModal>
        </>
    );
};
