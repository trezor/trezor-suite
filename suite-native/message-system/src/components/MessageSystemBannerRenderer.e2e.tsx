import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { selectActiveBannerMessages } from '@suite-common/message-system';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

type MessageSystemBannerRendererProps = { topSafeAreaInset: number };

// This component ignores banner for message system
/// but keeps insets to avoid layout shift in E2E tests
// FIXME: #18775
export const MessageSystemBannerRenderer = ({
    topSafeAreaInset,
}: MessageSystemBannerRendererProps) => {
    const { applyStyle } = useNativeStyles();
    const activeBannerMessages = useSelector(selectActiveBannerMessages);

    if (A.isEmpty(activeBannerMessages)) {
        return null;
    }

    return <Box style={applyStyle(messageBannerContainerStyle, { topSafeAreaInset })} />;
};
