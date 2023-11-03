import { ReactNode } from 'react';
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
import { FeatureMessageScreen } from './FeatureMessageScreen';

const messageSystemRendererStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

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
        <>
            {children}
            <Box
                style={applyStyle(messageSystemRendererStyle, {
                    topSafeAreaInset,
                })}
            >
                <VStack spacing={4}>
                    {activeBannerMessages.map(message => (
                        <MessageBanner key={message.id} message={message} />
                    ))}
                </VStack>
            </Box>
            {firstFeatureMessage && <FeatureMessageScreen message={firstFeatureMessage} />}
        </>
    );
};
