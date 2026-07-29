import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ErrorScreenContentProps = {
    onContactSupport: () => void;
    onClose: () => void;
};

export const ErrorScreenContent = ({ onContactSupport, onClose }: ErrorScreenContentProps) => (
    <VStack flex={1} justifyContent="space-between" alignItems="center">
        <Box flex={1} justifyContent="center" alignItems="center">
            <PictogramTitleHeader
                titleVariant="headline-md"
                variant="critical"
                title={<Translation id="moduleCreateAdditionalBackup.errorScreen.title" />}
                subtitle={<Translation id="moduleCreateAdditionalBackup.errorScreen.description" />}
            />
        </Box>
        <VStack alignSelf="stretch">
            <Button onPress={onContactSupport} intent="critical" priority="primary" isFullWidth>
                <Translation id="moduleCreateAdditionalBackup.errorScreen.supportButton" />
            </Button>
            <Button onPress={onClose} intent="critical" priority="secondary" isFullWidth>
                <Translation id="moduleCreateAdditionalBackup.errorScreen.notNowButton" />
            </Button>
        </VStack>
    </VStack>
);
