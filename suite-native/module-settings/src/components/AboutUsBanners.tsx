import { Card, HStack, IconButton, Text, TitledSection, VStack } from '@suite-native/atoms';
import { useCoinLabel } from '@suite-native/device';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';
import { TREZOR_INSTAGRAM_URL, TREZOR_TIKTOK_URL, TREZOR_X_URL } from '@trezor/urls';

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
    const coinLabel = useCoinLabel();

    return (
        <TitledSection title={<Translation id="moduleSettings.aboutUs.title" />}>
            <VStack>
                <Card
                    style={applyStyle(cardStyle, {
                        backgroundColor: 'legacyBackgroundNeutralBold',
                    })}
                >
                    <VStack spacing="sp24" style={applyStyle(stackStyle)}>
                        <Icon color="contentButtonBrandPrimary" name="trezorLogo" />
                        <Text
                            textAlign="center"
                            color="contentButtonBrandPrimary"
                            variant="headline-sm"
                            style={applyStyle(trezorDescriptionTextStyle)}
                        >
                            <Translation
                                id="moduleSettings.aboutUs.body"
                                values={{
                                    coinLabel,
                                }}
                            />
                        </Text>
                    </VStack>
                </Card>
                <Card
                    style={applyStyle(cardStyle, {
                        backgroundColor: 'legacyBackgroundSecondaryDefault',
                    })}
                >
                    <VStack spacing="sp24" style={applyStyle(stackStyle)}>
                        <Text color="contentPrimaryInverse" variant="headline-md">
                            <Translation id="moduleSettings.aboutUs.followUs" />
                        </Text>
                        <HStack spacing="sp24">
                            <IconButton
                                intent="neutral"
                                priority="secondary"
                                iconName="twitterLogo"
                                accessibilityRole="link"
                                accessibilityLabel="X"
                                onPress={() => openLink(TREZOR_X_URL, { enforce: true })}
                            />
                            <IconButton
                                intent="neutral"
                                priority="secondary"
                                iconName="tiktokLogo"
                                accessibilityRole="link"
                                accessibilityLabel="tiktok"
                                onPress={() =>
                                    openLink(TREZOR_TIKTOK_URL, {
                                        enforce: true,
                                    })
                                }
                            />
                            <IconButton
                                intent="neutral"
                                priority="secondary"
                                iconName="instagramLogo"
                                accessibilityRole="link"
                                accessibilityLabel="instagram"
                                onPress={() =>
                                    openLink(TREZOR_INSTAGRAM_URL, {
                                        enforce: true,
                                    })
                                }
                            />
                        </HStack>
                    </VStack>
                </Card>
            </VStack>
        </TitledSection>
    );
};
