import { Linking } from 'react-native';
import { useDispatch } from 'react-redux';

import { A, G } from '@mobily/ts-belt';

import { IconName } from '@suite-common/icons/src';
import { Box, Button, Pictogram, PictogramVariant, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Message, Variant } from '@suite-common/suite-types';
import { messageSystemActions } from '@suite-common/message-system';
import { useTranslate } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

type MessageScreenProps = {
    message: Message;
};

const screenStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.large,
    marginBottom: utils.spacings.extraLarge,
    flexGrow: 1,
    paddingTop: utils.spacings.xxl,
}));

const contentStyle = prepareNativeStyle(_ => ({
    flexGrow: 1,
    justifyContent: 'center',
}));

const buttonsWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
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

export const MessageScreen = ({ message }: MessageScreenProps) => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const {
        id: messageId,
        variant,
        headline,
        content,
        cta,
        dismissible: isDismissable,
        category,
        feature,
    } = message;

    const isKillswitch = A.isNotEmpty(
        feature?.filter(item => item.domain === 'killswitch' && item.flag) ?? [],
    );

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

    const handleDismiss = () => {
        if (!isDismissable) return;

        const categories = G.isArray(category) ? category : [category];
        categories.forEach(item => {
            dispatch(
                messageSystemActions.dismissMessage({
                    id: messageId,
                    category: item,
                }),
            );
        });
    };

    const defaultTitle = isKillswitch ? translate('messageSystem.killswitch.title') : undefined;
    const defaultContent = isKillswitch ? translate('messageSystem.killswitch.content') : undefined;

    return (
        <Screen>
            <Box style={applyStyle(screenStyle)}>
                <Box style={applyStyle(contentStyle)}>
                    <Pictogram
                        title={messageTitle ?? defaultTitle}
                        variant={variantMap[variant]}
                        subtitle={messageContent ?? defaultContent}
                        icon={iconVariantMap[variant]}
                        titleVariant="titleMedium"
                    />
                </Box>

                <VStack spacing="medium" style={applyStyle(buttonsWrapperStyle)}>
                    {isCtaVisible && (
                        <Button size="large" colorScheme="primary" onPress={handleCtaPress}>
                            {ctaLabel}
                        </Button>
                    )}
                    {isDismissable && (
                        <Button
                            size="large"
                            colorScheme="tertiaryElevation0"
                            onPress={handleDismiss}
                        >
                            {translate('generic.buttons.dismiss')}
                        </Button>
                    )}
                </VStack>
            </Box>
        </Screen>
    );
};
