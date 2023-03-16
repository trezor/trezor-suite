import React, { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectToastNotifications } from '../slice';
import { ToastNotification } from './ToastNotification';

type ToastNotificationRendererProps = {
    children: ReactNode;
};

const toastNotificationsContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        width: '100%',
        position: 'absolute',
        justifyContent: 'center',
        marginTop: topSafeAreaInset,
        paddingHorizontal: utils.spacings.medium,
    }),
);

export const ToastNotificationRenderer = ({ children }: ToastNotificationRendererProps) => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();
    const toastNotifications = useSelector(selectToastNotifications);

    return (
        <>
            {children}
            <Box
                pointerEvents="none"
                style={applyStyle(toastNotificationsContainerStyle, {
                    topSafeAreaInset,
                })}
            >
                <VStack alignItems="center">
                    {toastNotifications.map(toastNotification => (
                        <ToastNotification
                            notification={toastNotification}
                            key={toastNotification.id}
                        />
                    ))}
                </VStack>
            </Box>
        </>
    );
};
