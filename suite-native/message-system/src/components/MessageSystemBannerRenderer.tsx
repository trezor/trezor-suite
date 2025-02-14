import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { selectActiveBannerMessages } from '@suite-common/message-system';
import { VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { MessageBanner } from './MessageBanner';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

export const useIsMessageSystemBannerVisible = () =>
    A.isNotEmpty(useSelector(selectActiveBannerMessages));

type MessageSystemBannerRendererProps = { topSafeAreaInset: number };

export const MessageSystemBannerRenderer = ({
    topSafeAreaInset,
}: MessageSystemBannerRendererProps) => {
    const { applyStyle } = useNativeStyles();

    const activeBannerMessages = useSelector(selectActiveBannerMessages);

    if (A.isEmpty(activeBannerMessages)) return null;

    return (
        <VStack spacing="sp4" style={applyStyle(messageBannerContainerStyle, { topSafeAreaInset })}>
            {activeBannerMessages.map(message => (
                <MessageBanner key={message.id} message={message} />
            ))}
        </VStack>
    );
};
