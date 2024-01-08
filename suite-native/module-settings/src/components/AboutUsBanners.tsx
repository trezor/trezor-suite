import { Card, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';
import { useOpenLink } from '@suite-native/link';

const cardStyle = prepareNativeStyle<{ backgroundColor: Color }>((utils, { backgroundColor }) => ({
    paddingHorizontal: utils.spacings.large,
    paddingVertical: utils.spacings.large * 2,
    backgroundColor: utils.colors[backgroundColor],
}));

const stackStyle = prepareNativeStyle(_ => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
}));

const trezorDescriptionTextStyle = prepareNativeStyle(_ => ({
    lineHeight: 32,
}));

export const AboutUsBanners = () => {
    const openLink = useOpenLink();
    const { applyStyle } = useNativeStyles();

    return (
        <VStack>
            <Card style={applyStyle(cardStyle, { backgroundColor: 'backgroundNeutralBold' })}>
                <VStack spacing="large" style={applyStyle(stackStyle)}>
                    <Icon color="iconOnPrimary" name="trezor" />
                    <Text
                        textAlign="center"
                        color="textOnPrimary"
                        variant="titleSmall"
                        style={applyStyle(trezorDescriptionTextStyle)}
                    >
                        Trezor Suite Lite is a safe and secure way to stay connected to the crypto
                        on your hardware wallet. Track coin balances on the go without exposing your
                        private data. Easily create and send payment addresses to anyone.
                    </Text>
                </VStack>
            </Card>
            <Card style={applyStyle(cardStyle, { backgroundColor: 'backgroundSecondaryDefault' })}>
                <VStack spacing="large" style={applyStyle(stackStyle)}>
                    <Text color="textDefaultInverse" variant="titleMedium">
                        Follow us
                    </Text>
                    <HStack spacing="large">
                        <IconButton
                            size="large"
                            colorScheme="tertiaryElevation1"
                            iconName="facebook"
                            accessibilityRole="link"
                            accessibilityLabel="facebook"
                            onPress={() => openLink('https://www.facebook.com/trezor.io')}
                        />
                        <IconButton
                            size="large"
                            colorScheme="tertiaryElevation1"
                            iconName="twitter"
                            accessibilityRole="link"
                            accessibilityLabel="twitter"
                            onPress={() => openLink('https://twitter.com/Trezor')}
                        />
                        <IconButton
                            size="large"
                            colorScheme="tertiaryElevation1"
                            iconName="github"
                            accessibilityRole="link"
                            accessibilityLabel="github"
                            onPress={() => openLink('https://github.com/trezor')}
                        />
                    </HStack>
                </VStack>
            </Card>
        </VStack>
    );
};
