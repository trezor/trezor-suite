import { type ReactNode } from 'react';

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
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnModalStepIndicator } from '../earn/EarnModalStepIndicator';

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

export type YieldFlowStep<TStepId extends string> = {
    id: TStepId;
    /** Marks a finished step the user chose to skip. */
    isSkipped?: boolean;
    label: ReactNode;
};

type YieldFlowStepCardProps<TStepId extends string> = {
    currentStepId: TStepId;
    modalTitle: TxKeyPath;
    /** Handlers returning to an already finished step; without them the sheet is a plain list. */
    onEditStep?: Partial<Record<TStepId, () => void>>;
    steps: readonly YieldFlowStep<TStepId>[];
};

/** Current step of a yield flow, expanding into the whole sequence in a bottom sheet. */
export const YieldFlowStepCard = <TStepId extends string>({
    currentStepId,
    modalTitle,
    onEditStep,
    steps,
}: YieldFlowStepCardProps<TStepId>) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const editableSteps = steps.map(step => {
        const onEdit = onEditStep?.[step.id];

        return {
            ...step,
            onEdit:
                onEdit &&
                (() => {
                    closeModal();
                    onEdit();
                }),
        };
    });
    const currentStepIndex = editableSteps.findIndex(step => step.id === currentStepId);
    const currentStep = editableSteps[currentStepIndex];

    // A single-step flow has no sequence to show, and an unknown step must not be labelled as the
    // first one of it.
    if (!currentStep || editableSteps.length < 2) {
        return null;
    }

    return (
        <>
            <PressableOpacity style={applyStyle(stepCardStyle)} onPress={openModal}>
                <HStack spacing="sp16" alignItems="center">
                    <VStack flex={1} spacing="sp2">
                        <Text variant="body-sm">
                            <Translation
                                id="earn.yieldDepositFlowScreen.step"
                                values={{
                                    stepNumber: currentStepIndex + 1,
                                    stepCount: editableSteps.length,
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
                title={<Translation id={modalTitle} />}
                footer={
                    <Box style={applyStyle(bottomSheetFooterStyle)}>
                        <Button onPress={closeModal}>
                            <Translation id="generic.buttons.gotIt" />
                        </Button>
                    </Box>
                }
                onClose={closeModal}
            >
                <EarnModalStepIndicator currentStepIndex={currentStepIndex} steps={editableSteps} />
            </BottomSheetModal>
        </>
    );
};
