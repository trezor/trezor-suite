import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

import { checkBackupThunk } from '../checkBackupThunks';

type NavigationProps = StackNavigationProps<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes.CheckBackup
>;

export const useCheckBackupOnMount = () => {
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const navigation = useNavigation<NavigationProps>();

    useEffect(() => {
        const startCheckBackup = async () => {
            const response = await dispatch(checkBackupThunk());

            // TODO: handle the failure response (https://github.com/trezor/trezor-suite/issues/19841)
            // a) user exited the screen
            // b) backup check failed
            // c) device was disconnected
            if (isRejected(response) || (isFulfilled(response) && !response.payload?.success)) {
                showToast({
                    message: 'TODO: handle failed CHECK BACKUP',
                    variant: 'warning',
                });
            } else {
                navigation.navigate(DeviceCheckBackupStackRoutes.CheckBackupSuccess);
            }
        };
        startCheckBackup();

        // This use effect should be triggered only during the first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
