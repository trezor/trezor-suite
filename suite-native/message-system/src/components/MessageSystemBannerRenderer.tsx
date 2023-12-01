import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { VStack } from '@suite-native/atoms';
import { selectActiveBannerMessages } from '@suite-common/message-system';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { MessageBanner } from './MessageBanner';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        extend: {
            condition: Platform.OS === 'ios',
            style: {
                marginTop: topSafeAreaInset,
            },
        },
    }),
);

export const MessageSystemBannerRenderer = () => {
    const activeBannerMessages = useSelector(selectActiveBannerMessages);

    const { applyStyle } = useNativeStyles();

    const { top: topSafeAreaInset } = useSafeAreaInsets();

    return (
        <VStack
            spacing={4}
            style={applyStyle(messageBannerContainerStyle, {
                topSafeAreaInset,
            })}
        >
            {activeBannerMessages.map(message => (
                <MessageBanner key={message.id} message={message} />
            ))}
        </VStack>
    );
};
