import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useOpenLink } from '@suite-native/link';
import { Button, Card, HStack, Pictogram, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

const supportCardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.extraLarge,
}));

export const SupportCard = () => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const handleOpenSupportLink = () => openLink('https://trezor.io/learn/c/trezor-suite-lite');

    return (
        <Card style={applyStyle(supportCardStyle)}>
            <HStack justifyContent="space-between">
                <VStack spacing="medium" alignItems="flex-start" paddingTop="s">
                    <Text variant="titleSmall">
                        <Translation id="moduleSettings.faq.supportCard.title" />
                    </Text>
                    <Button size="s" onPress={handleOpenSupportLink}>
                        {translate('moduleSettings.faq.supportCard.contact')}
                    </Button>
                </VStack>
                <Pictogram variant="green" size="s" icon="lifebuoy" />
            </HStack>
        </Card>
    );
};
