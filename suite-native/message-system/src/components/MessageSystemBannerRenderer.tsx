import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectActiveBannerMessages } from '@suite-common/message-system';
import { useOfflineBannerAwareSafeAreaInsets } from '@suite-native/connection-status';

import { MessageBanner } from './MessageBanner';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

export const MessageSystemBannerRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useOfflineBannerAwareSafeAreaInsets();

    const activeBannerMessages = useSelector(selectActiveBannerMessages);
    const topInset = A.isNotEmpty(activeBannerMessages) ? topSafeAreaInset : 0;

    return (
        <VStack
            spacing="sp4"
            style={applyStyle(messageBannerContainerStyle, {
                topSafeAreaInset: topInset,
            })}
        >
            {activeBannerMessages.map(message => (
                <MessageBanner key={message.id} message={message} />
            ))}
        </VStack>
    );
};
