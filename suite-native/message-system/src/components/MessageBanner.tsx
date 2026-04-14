import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';

import { messageSystemActions } from '@suite-common/message-system';
import { type Message, type Variant } from '@suite-common/suite-types';
import { Box, HStack, PressableOpacity, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { MessageLink } from './MessageLink';

type MessageBannerProps = {
    message: Message;
};

const CONTEXT_MESSAGE_ANIMATION_DURATION = 250;

type MessageBannerStyle = {
    backgroundColor: Color;
    icon: IconName;
    iconColor: Color;
    iconBackgroundColor: Color;
};

const MessageBannerVariantToStyleMap = {
    info: {
        backgroundColor: 'legacyBackgroundAlertBlueSubtleOnElevation0',
        icon: 'info',
        iconColor: 'contentInfo',
        iconBackgroundColor: 'legacyBackgroundAlertBlueSubtleOnElevation1',
    },
    warning: {
        backgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation0',
        icon: 'warning',
        iconColor: 'contentWarning',
        iconBackgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation1',
    },
    critical: {
        backgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation0',
        icon: 'warning',
        iconColor: 'contentCritical',
        iconBackgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation1',
    },
} as const satisfies Record<Variant, MessageBannerStyle>;

const messageContainerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        backgroundColor: utils.colors[backgroundColor],
        padding: utils.spacings.sp16,
        flexShrink: 1,
    }),
);

const IconContainerStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    justifyContent: 'center',
    alignItems: 'center',
}));

const messageTextContainerStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
}));

const MessageCloseButton = ({
    backgroundColor,
    onClose,
}: {
    backgroundColor: Color;
    onClose: () => void;
}) => (
    <PressableOpacity onPress={onClose}>
        <RoundedIcon
            name="x"
            iconSize="medium"
            containerSize={44}
            backgroundColor={backgroundColor}
        />
    </PressableOpacity>
);

export const MessageBanner = ({ message }: MessageBannerProps) => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();

    // TODO: We use only English locale in suite-native so far. When the localization to other
    // languages is implemented, the language selection logic has to be added here.
    const language = 'en';
    const messageContent = message.content[language];

    const isMessageDismissible = message.dismissible;

    const handleDismissMessage = () => {
        dispatch(
            messageSystemActions.dismissMessage({
                id: message.id,
                category: 'banner',
            }),
        );
    };

    const { backgroundColor, iconColor, icon, iconBackgroundColor } =
        MessageBannerVariantToStyleMap[message.variant];

    return (
        <Animated.View
            entering={FadeIn.duration(CONTEXT_MESSAGE_ANIMATION_DURATION)}
            exiting={FadeOut.duration(CONTEXT_MESSAGE_ANIMATION_DURATION)}
            style={applyStyle(messageContainerStyle, { backgroundColor })}
        >
            <HStack
                spacing="sp12"
                alignItems="center"
                justifyContent="space-between"
                style={{ maxWidth: '100%' }}
            >
                <Box style={applyStyle(IconContainerStyle)}>
                    <Icon name={icon} color={iconColor} size="mediumLarge" />
                </Box>
                <VStack spacing="sp4" style={applyStyle(messageTextContainerStyle)}>
                    <Text color="contentSecondary" variant="body-sm">
                        {messageContent}
                    </Text>

                    {message.cta && (
                        <MessageLink
                            messageCTA={message.cta}
                            language={language}
                            textVariant="body-md"
                        />
                    )}
                </VStack>
                {isMessageDismissible && (
                    <MessageCloseButton
                        backgroundColor={iconBackgroundColor}
                        onClose={handleDismissMessage}
                    />
                )}
            </HStack>
        </Animated.View>
    );
};
