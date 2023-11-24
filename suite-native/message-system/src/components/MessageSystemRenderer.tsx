import { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { Screen } from '@suite-native/navigation';
import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    selectActiveBannerMessages,
    selectActiveFeatureMessages,
} from '@suite-common/message-system';

import { MessageBanner } from './MessageBanner';
import { MessageScreen } from './MessageScreen';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

const messageFeatureContainerStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
}));

type MessageSystemRendererProps = {
    children: ReactNode;
};

export const MessageSystemRenderer = ({ children }: MessageSystemRendererProps) => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();

    const activeBannerMessages = useSelector(selectActiveBannerMessages);
    const activeFeatureMessages = useSelector(selectActiveFeatureMessages);
    const firstFeatureMessage = A.head(activeFeatureMessages);

    return (
        <Screen>
            {children}
            <Box
                style={applyStyle(messageBannerContainerStyle, {
                    topSafeAreaInset,
                })}
            >
                <VStack spacing="extraSmall">
                    {activeBannerMessages.map(message => (
                        <MessageBanner key={message.id} message={message} />
                    ))}
                </VStack>
            </Box>
            {/* Put feature screen over everything else */}
            {firstFeatureMessage && (
                <Box style={applyStyle(messageFeatureContainerStyle)}>
                    <MessageScreen message={firstFeatureMessage} />
                </Box>
            )}
        </Screen>
    );
};
