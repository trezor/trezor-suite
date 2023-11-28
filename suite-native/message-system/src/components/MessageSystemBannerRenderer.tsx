import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectActiveBannerMessages } from '@suite-common/message-system';

import { MessageBanner } from './MessageBanner';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

export const MessageSystemBannerRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();

    const activeBannerMessages = useSelector(selectActiveBannerMessages);

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
