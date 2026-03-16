import { BottomSheetListItem, Box, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type SystemUnpairingAlertIosInstructionsProps = {
    translationKey: TxKeyPath;
};

export const SystemUnpairingAlertIosInstructions = ({
    translationKey,
}: SystemUnpairingAlertIosInstructionsProps) => (
    <Box>
        <Text>
            <Translation id={translationKey} />
        </Text>
        <VStack paddingTop="sp24">
            <BottomSheetListItem
                iconNumber={1}
                translationKey="bluetooth.alerts.pairingInstructions.step1"
            />
            <BottomSheetListItem
                iconNumber={2}
                translationKey="bluetooth.alerts.pairingInstructions.step2"
            />
            <BottomSheetListItem
                iconNumber={3}
                translationKey="bluetooth.alerts.pairingInstructions.step3"
            />
        </VStack>
    </Box>
);
