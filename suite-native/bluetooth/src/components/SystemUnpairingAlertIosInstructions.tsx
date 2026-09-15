import { BottomSheetListItem, VStack } from '@suite-native/atoms';

export const SystemUnpairingAlertIosInstructions = () => (
    <VStack>
        <BottomSheetListItem
            icon={1}
            translationKey="bluetooth.alerts.unpairingInstructions.step1"
        />
        <BottomSheetListItem
            icon={2}
            translationKey="bluetooth.alerts.unpairingInstructions.step2"
        />
        <BottomSheetListItem
            icon={3}
            translationKey="bluetooth.alerts.unpairingInstructions.step3"
        />
    </VStack>
);
