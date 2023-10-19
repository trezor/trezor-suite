import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectActiveBannerMessages } from '@suite-common/message-system';

import { MessageBanner } from './MessageBanner';

const messageSystemRendererStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

export const MessageSystemRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();

    const activeBannerMessages = useSelector(selectActiveBannerMessages);

    if (A.isEmpty(activeBannerMessages)) return null;

    return (
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
    );
};
