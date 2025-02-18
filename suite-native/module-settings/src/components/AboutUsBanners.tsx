import { Card, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

const cardStyle = prepareNativeStyle<{ backgroundColor: Color }>((utils, { backgroundColor }) => ({
    paddingHorizontal: utils.spacings.sp24,
    paddingVertical: utils.spacings.sp24 * 2,
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
        <VStack spacing="sp16">
            <Card style={applyStyle(cardStyle, { backgroundColor: 'backgroundNeutralBold' })}>
                <VStack spacing="sp24" style={applyStyle(stackStyle)}>
                    <Icon color="iconOnPrimary" name="trezorLogo" />
                    <Text
                        textAlign="center"
                        color="textOnPrimary"
                        variant="titleSmall"
                        style={applyStyle(trezorDescriptionTextStyle)}
                    >
                        <Translation id="moduleSettings.aboutUs.body" />
                    </Text>
                </VStack>
            </Card>
            <Card style={applyStyle(cardStyle, { backgroundColor: 'backgroundSecondaryDefault' })}>
                <VStack spacing="sp24" style={applyStyle(stackStyle)}>
                    <Text color="textDefaultInverted" variant="titleMedium">
                        <Translation id="moduleSettings.aboutUs.followUs" />
                    </Text>
                    <HStack spacing="sp24">
                        <IconButton
                            size="large"
                            colorScheme="tertiaryElevation1"
                            iconName="twitterLogo"
                            accessibilityRole="link"
                            accessibilityLabel="X"
                            onPress={() => openLink('https://x.com/trezor', { enforce: true })}
                        />
                        <IconButton
                            size="large"
                            colorScheme="tertiaryElevation1"
                            iconName="tiktokLogo"
                            accessibilityRole="link"
                            accessibilityLabel="tiktok"
                            onPress={() =>
                                openLink('https://www.tiktok.com/@trezor.io_official', {
                                    enforce: true,
                                })
                            }
                        />
                        <IconButton
                            size="large"
                            colorScheme="tertiaryElevation1"
                            iconName="instagramLogo"
                            accessibilityRole="link"
                            accessibilityLabel="instagram"
                            onPress={() =>
                                openLink('https://www.instagram.com/trezor.io/', { enforce: true })
                            }
                        />
                    </HStack>
                </VStack>
            </Card>
        </VStack>
    );
};
