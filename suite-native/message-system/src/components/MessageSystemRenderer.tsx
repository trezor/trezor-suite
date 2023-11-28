import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    selectActiveBannerMessages,
    selectActiveFeatureMessages,
} from '@suite-common/message-system';

import { MessageBanner } from './MessageBanner';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

export const MessageSystemRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();

    const activeBannerMessages = useSelector(selectActiveBannerMessages);
    const activeFeatureMessages = useSelector(selectActiveFeatureMessages);
    const firstFeatureMessage = A.head(activeFeatureMessages);

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
