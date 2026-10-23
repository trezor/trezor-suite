import { Box, Button, HStack, ScreenFooterGradient } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

export const AssetDetailActions = () => {
    const { showToast } = useToast();

    const handleActionPress = () => {
        showToast({
            intent: 'neutral',
            message: 'Coming soon',
        });
    };

    return (
        <Box>
            <ScreenFooterGradient />
            <HStack spacing="sp12" paddingHorizontal="sp20" paddingTop="sp8" paddingBottom="sp16">
                <Button
                    flex={1}
                    iconRight="arrowLineDown"
                    onPress={handleActionPress}
                    testID="@assets/asset-detail/receive-button"
                >
                    <Translation id="transactions.receive" />
                </Button>
                <Button
                    flex={1}
                    priority="secondary"
                    iconRight="arrowLineUp"
                    onPress={handleActionPress}
                    testID="@assets/asset-detail/send-button"
                >
                    <Translation id="transactions.send" />
                </Button>
            </HStack>
        </Box>
    );
};
