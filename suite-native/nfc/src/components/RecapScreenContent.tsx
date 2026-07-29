import { Box, Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SwipeableWalkthroughStepHeader } from '@suite-native/swipeable-walkthrough';

type RecapScreenContentProps = {
    onClose: () => void;
};

export const RecapScreenContent = ({ onClose }: RecapScreenContentProps) => (
    <VStack flex={1} justifyContent="space-between" alignItems="center">
        <Box flex={1} justifyContent="center" alignItems="center">
            <SwipeableWalkthroughStepHeader
                callout={<Translation id="moduleCreateAdditionalBackup.recapScreen.callout" />}
                title={<Translation id="moduleCreateAdditionalBackup.recapScreen.title" />}
                description={
                    <Translation id="moduleCreateAdditionalBackup.recapScreen.description" />
                }
            />
        </Box>
        <Button onPress={onClose} isFullWidth>
            <Translation id="moduleCreateAdditionalBackup.recapScreen.button" />
        </Button>
    </VStack>
);
