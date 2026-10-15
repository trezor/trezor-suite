import { Box, HStack, IconButton, Text } from '@suite-native/atoms';
import { safeParseUrl } from '@trezor/utils';

type EmbeddedAppWebViewToolbarProps = {
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
    onBack: () => void;
    onForward: () => void;
    onReload: () => void;
};

export const EmbeddedAppWebViewToolbar = ({
    url,
    canGoBack,
    canGoForward,
    onBack,
    onForward,
    onReload,
}: EmbeddedAppWebViewToolbarProps) => (
    <HStack spacing="sp8" alignItems="center">
        <IconButton
            iconName="arrowLeft"
            size="small"
            intent="neutral"
            priority="secondary"
            isDisabled={!canGoBack}
            onPress={onBack}
            accessibilityLabel="Back"
            testID="@dev-utils/apps-embedding/toolbar/back"
        />
        <IconButton
            iconName="arrowRight"
            size="small"
            intent="neutral"
            priority="secondary"
            isDisabled={!canGoForward}
            onPress={onForward}
            accessibilityLabel="Forward"
            testID="@dev-utils/apps-embedding/toolbar/forward"
        />
        <IconButton
            iconName="arrowsClockwise"
            size="small"
            intent="neutral"
            priority="secondary"
            onPress={onReload}
            accessibilityLabel="Reload"
            testID="@dev-utils/apps-embedding/toolbar/reload"
        />
        <Box flex={1}>
            <Text
                variant="body-sm"
                color="contentSecondary"
                textAlign="center"
                numberOfLines={1}
                testID="@dev-utils/apps-embedding/toolbar/origin"
            >
                {safeParseUrl(url)?.origin ?? url}
            </Text>
        </Box>
    </HStack>
);
