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

const steps = [
    {
        id: 'approval',
        label: <Translation id="earn.yieldSupplyFlowScreen.approvalStepTitle" />,
    },
    {
        id: 'supply',
        label: <Translation id="earn.yieldSupplyFlowScreen.supplyTransactionStepTitle" />,
    },
    {
        id: 'complete',
        label: <Translation id="earn.yieldSupplyFlowScreen.supplyCompleteStepTitle" />,
    },
];

export const YieldSupplyStepCard = () => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <PressableOpacity style={applyStyle(stepCardStyle)} onPress={openModal}>
                <HStack spacing="sp16" alignItems="center">
                    <VStack flex={1} spacing="sp2">
                        <Text variant="body-sm">
                            <Translation
                                id="earn.yieldSupplyFlowScreen.step"
                                values={{ stepNumber: 1, stepCount: steps.length }}
                            />
                        </Text>
                        <Text variant="body-md-strong">
                            <Translation id="earn.yieldSupplyFlowScreen.approvalStepTitle" />
                        </Text>
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
                {/* TODO: Derive current step from the full supply flow once it is implemented. */}
                <EarnModalStepIndicator currentStepIndex={0} steps={steps} />
            </BottomSheetModal>
        </>
    );
};
