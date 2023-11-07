import { TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Message, Variant, CTA } from '@suite-common/suite-types';
import { messageSystemActions } from '@suite-common/message-system';
import { Color } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HStack, Box, Text, RoundedIcon, VStack } from '@suite-native/atoms';
import { IconName, Icon } from '@suite-common/icons';
import { Link } from '@suite-native/link';

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
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation0',
        icon: 'info',
        iconColor: 'iconAlertBlue',
        iconBackgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
    },
    warning: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation0',
        icon: 'warningTriangle',
        iconColor: 'iconAlertYellow',
        iconBackgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
    },
    critical: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        icon: 'warningOctagon',
        iconColor: 'iconAlertRed',
        iconBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
    },
} as const satisfies Record<Variant, MessageBannerStyle>;

const messageContainerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        backgroundColor: utils.colors[backgroundColor],
        padding: utils.spacings.m,
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

const MessageLink = ({ messageCTA }: { messageCTA?: CTA }) => {
    // TODO: We use only English locale in suite-native so far. When the localization to other
    // languages is implemented, the language selection logic has to be added here.
    const messageLinkLabel = messageCTA?.label.en;
    const messageLink = messageCTA?.link;
    const isExternalLink = messageCTA?.action === 'external-link';

    const isLinkDisplayable = isExternalLink && messageLinkLabel && messageLink;

    if (!isLinkDisplayable) return null;

    return (
        <Link
            href={messageLink}
            label={messageLinkLabel}
            isUnderlined
            textColor="textDefault"
            textPressedColor="textSubdued"
        />
    );
};

const MessageCloseButton = ({
    backgroundColor,
    onClose,
}: {
    backgroundColor: Color;
    onClose: () => void;
}) => (
    <TouchableOpacity onPress={onClose}>
        <RoundedIcon
            name="close"
            iconSize="m"
            containerSize={44}
            backgroundColor={backgroundColor}
        />
    </TouchableOpacity>
);

export const MessageBanner = ({ message }: MessageBannerProps) => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();

    // TODO: We use only English locale in suite-native so far. When the localization to other
    // languages is implemented, the language selection logic has to be added here.
    const messageContent = message.content.en;

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
                spacing={12}
                alignItems="center"
                justifyContent="space-between"
                style={{ maxWidth: '100%' }}
            >
                <Box style={applyStyle(IconContainerStyle)}>
                    <Icon name={icon} color={iconColor} size="mediumLarge" />
                </Box>
                <VStack spacing={4} style={applyStyle(messageTextContainerStyle)}>
                    <Text color="textSubdued" variant="hint">
                        {messageContent}
                    </Text>

                    {message.cta && <MessageLink messageCTA={message.cta} />}
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
