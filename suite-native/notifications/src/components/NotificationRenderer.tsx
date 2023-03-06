import React, { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import {
    NotificationsRootState,
    selectTransactionNotifications,
} from '@suite-common/toast-notifications';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionNotification } from './TransactionNotification';

type NotificationRendererProps = {
    children: ReactNode;
};

const notificationContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        position: 'absolute',
        flex: 1,
        flexDirection: 'row',
        marginTop: topSafeAreaInset,
        paddingHorizontal: utils.spacings.medium,
    }),
);

export const NotificationRenderer = ({ children }: NotificationRendererProps) => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();
    const transactionNotifications = useSelector((state: NotificationsRootState) =>
        selectTransactionNotifications(state),
    );

    if (!transactionNotifications) return null;

    return (
        <>
            {children}
            <Box
                style={applyStyle(notificationContainerStyle, {
                    topSafeAreaInset,
                })}
            >
                <VStack flex={1}>
                    {transactionNotifications.map(notification => (
                        <TransactionNotification
                            notification={notification}
                            key={notification.id}
                        />
                    ))}
                </VStack>
            </Box>
        </>
    );
};
