import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ThpPairingSuccessScreenContentProps = {
    onContinue: () => void;
};

export const ThpPairingSuccessScreenContent = ({
    onContinue,
}: ThpPairingSuccessScreenContentProps) => (
    <VStack flex={1} justifyContent="space-between" spacing="sp32">
        <Box flex={1} justifyContent="center" paddingHorizontal="sp16">
            <PictogramTitleHeader
                variant="success"
                title={<Translation id="thp.pairingSuccess.title" />}
                titleVariant="headline-md"
            />
        </Box>
        <Button onPress={onContinue}>
            <Translation id="generic.buttons.continue" />
        </Button>
    </VStack>
);
