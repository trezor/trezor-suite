import { Button, Card, HStack, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HELP_CENTER_WHAT_IS_TREZOR_SUITE_LITE_URL } from '@trezor/urls';

const supportCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp32,
}));

export const SupportCard = () => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const handleOpenSupportLink = () => openLink(HELP_CENTER_WHAT_IS_TREZOR_SUITE_LITE_URL);

    return (
        <Card style={applyStyle(supportCardStyle)}>
            <HStack justifyContent="space-between">
                <VStack spacing="sp16" alignItems="flex-start" paddingTop="sp8">
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
