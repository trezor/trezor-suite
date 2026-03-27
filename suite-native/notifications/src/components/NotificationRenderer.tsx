import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { selectOpenedTransactionNotifications } from '@suite-common/toast-notifications';
import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionNotification } from './TransactionNotification';

const notificationContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    ({ spacings }, { topSafeAreaInset }) => ({
        width: '100%',
        position: 'absolute',
        justifyContent: 'center',
        // top margin = screen top padding + screen header top padding
        marginTop: Math.max(topSafeAreaInset, spacings.sp8),
        paddingHorizontal: spacings.sp8,
    }),
);

export const NotificationRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();
    const transactionNotifications = useSelector(selectOpenedTransactionNotifications);

    return (
        <Box
            style={applyStyle(notificationContainerStyle, {
                topSafeAreaInset,
            })}
        >
            <VStack>
                {transactionNotifications.map(({ id }) => (
                    <TransactionNotification notificationId={id} key={id} />
                ))}
            </VStack>
        </Box>
    );
};
