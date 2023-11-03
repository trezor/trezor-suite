import { Linking } from 'react-native';

import { IconName } from '@suite-common/icons/src';
import { Box, Button, Pictogram, PictogramVariant, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Message, Variant } from '@suite-common/suite-types';

type MessageScreenProps = {
    message: Message;
    defaultTitle?: string;
    defaultContent?: string;
    secondaryButtonLabel?: string;
    onSecondaryButtonPress?: () => void;
};

const screenStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    paddingTop: utils.spacings.extraLarge,
    paddingHorizontal: utils.spacings.large,
    marginBottom: utils.spacings.extraLarge,
    flex: 1,
}));

const buttonsWrapperStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: utils.spacings.large,
    marginBottom: utils.spacings.extraLarge,
}));

const variantMap = {
    info: 'green',
    warning: 'yellow',
    critical: 'red',
} as const satisfies Record<Variant, PictogramVariant>;

const iconVariantMap = {
    info: 'info',
    warning: 'warningTriangleLight',
    critical: 'warningTriangleLight',
} as const satisfies Record<Variant, IconName>;

export const MessageScreen = ({
    message,
    defaultTitle,
    defaultContent,
    secondaryButtonLabel,
    onSecondaryButtonPress,
}: MessageScreenProps) => {
    const { applyStyle } = useNativeStyles();

    const { variant, headline, content, cta } = message;

    // TODO: We use only English locale in suite-native so far. When the localization to other
    // languages is implemented, the language selection logic has to be added here.
    const messageTitle = headline?.en;
    const messageContent = content.en;
    const ctaLabel = cta?.label.en;
    const ctaLink = cta?.link;
    const isExternalCta = cta?.action === 'external-link';

    const handleCtaPress = () => {
        if (isExternalCta && ctaLink) {
            Linking.openURL(ctaLink);
        } else {
            // TODO: handle internal link once we introduce them
        }
    };

    const isCtaVisible = ctaLabel && ctaLink;
    const isSecondaryVisible = secondaryButtonLabel && onSecondaryButtonPress;

    return (
        <Box style={applyStyle(screenStyle)}>
            <Pictogram
                title={messageTitle ?? defaultTitle}
                variant={variantMap[variant]}
                subtitle={messageContent ?? defaultContent}
                icon={iconVariantMap[variant]}
                titleVariant="titleMedium"
            />

            <VStack spacing="medium" style={applyStyle(buttonsWrapperStyle)}>
                {isCtaVisible && (
                    <Button size="large" colorScheme="primary" onPress={handleCtaPress}>
                        {ctaLabel}
                    </Button>
                )}
                {isSecondaryVisible && (
                    <Button
                        size="large"
                        colorScheme="tertiaryElevation0"
                        onPress={onSecondaryButtonPress}
                    >
                        {secondaryButtonLabel}
                    </Button>
                )}
            </VStack>
        </Box>
    );
};
