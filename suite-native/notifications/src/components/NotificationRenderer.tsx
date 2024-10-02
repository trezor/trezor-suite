import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { selectOpenedTransactionNotifications } from '@suite-common/toast-notifications';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useOfflineBannerAwareSafeAreaInsets } from '@suite-native/connection-status';

import { TransactionNotification } from './TransactionNotification';

const notificationContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        position: 'absolute',
        flex: 1,
        flexDirection: 'row',
        marginTop: topSafeAreaInset,
        paddingHorizontal: utils.spacings.sp16,
    }),
);

export const NotificationRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useOfflineBannerAwareSafeAreaInsets();
    const transactionNotifications = useSelector(selectOpenedTransactionNotifications);

    return (
        <Box
            style={applyStyle(notificationContainerStyle, {
                topSafeAreaInset,
            })}
        >
            <VStack flex={1}>
                {transactionNotifications.map(({ id }) => (
                    <TransactionNotification notificationId={id} key={id} />
                ))}
            </VStack>
        </Box>
    );
};
