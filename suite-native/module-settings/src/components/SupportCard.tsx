import { Button, Card, HStack, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SUITE_MOBILE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const supportCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp32,
}));

export const SupportCard = () => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const handleOpenSupportLink = () => openLink(SUITE_MOBILE_SUPPORT_URL);

    return (
        <Card style={applyStyle(supportCardStyle)}>
            <HStack justifyContent="space-between">
                <VStack spacing="sp16" alignItems="flex-start" paddingTop="sp8" flex={1}>
                    <Text variant="titleSmall">
                        <Translation id="moduleSettings.faq.supportCard.title" />
                    </Text>
                    <Button size="small" onPress={handleOpenSupportLink}>
                        <Translation id="moduleSettings.faq.supportCard.contact" />
                    </Button>
                </VStack>
                <PictogramTitleHeader variant="success" icon="lifebuoy" />
            </HStack>
        </Card>
    );
};
