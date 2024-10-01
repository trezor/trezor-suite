import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useOpenLink } from '@suite-native/link';
import { Button, Card, HStack, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

const supportCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp32,
}));

export const SupportCard = () => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const handleOpenSupportLink = () => openLink('https://trezor.io/learn/c/trezor-suite-lite');

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
                <PictogramTitleHeader variant="green" size="small" icon="lifebuoy" />
            </HStack>
        </Card>
    );
};
