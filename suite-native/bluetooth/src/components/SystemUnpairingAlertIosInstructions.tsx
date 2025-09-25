import { BottomSheetListItem, Box, Text, VStack } from '@suite-native/atoms';
import { Translation, TxKeyPath, useTranslate } from '@suite-native/intl';

type SystemUnpairingAlertIosInstructionsProps = {
    translationKey: TxKeyPath;
    deviceName?: string;
};

export const SystemUnpairingAlertIosInstructions = ({
    translationKey,
    deviceName,
}: SystemUnpairingAlertIosInstructionsProps) => {
    const { translate } = useTranslate();

    return (
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
                    translationValues={{
                        deviceName:
                            deviceName ??
                            translate('bluetooth.alerts.pairingFailed.deviceNamePlaceholder'),
                    }}
                />
                <BottomSheetListItem
                    iconNumber={3}
                    translationKey="bluetooth.alerts.pairingInstructions.step3"
                />
            </VStack>
        </Box>
    );
};
