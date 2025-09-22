import { useSelector } from 'react-redux';

import { selectDeviceName } from '@suite-common/wallet-core';
import { BottomSheetListItem, Box, Text, VStack } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';

type SystemUnpairingAlertIosInstructionsProps = {
    translationKey: TxKeyPath;
};

export const SystemUnpairingAlertIosInstructions = ({
    translationKey,
}: SystemUnpairingAlertIosInstructionsProps) => {
    const deviceName = useSelector(selectDeviceName);

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
                        deviceName,
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
