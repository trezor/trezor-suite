import { BottomSheetListItem, VStack } from '@suite-native/atoms';

export const SystemUnpairingAlertIosInstructions = () => (
    <VStack>
        <BottomSheetListItem
            iconNumber={1}
            translationKey="bluetooth.alerts.unpairingInstructions.step1"
        />
        <BottomSheetListItem
            iconNumber={2}
            translationKey="bluetooth.alerts.unpairingInstructions.step2"
        />
        <BottomSheetListItem
            iconNumber={3}
            translationKey="bluetooth.alerts.unpairingInstructions.step3"
        />
    </VStack>
);
