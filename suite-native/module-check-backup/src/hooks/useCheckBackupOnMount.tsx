import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { checkBackupThunk } from '../checkBackupThunks';

type NavigationProps = StackNavigationProps<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes.CheckBackup
>;

// Do not retry if user cancelled the flow via the app or FW UI.
const DEFINITIVE_ERRORS: ERRORS.ErrorCode[] = ['Method_Interrupted', 'Failure_ActionCancelled'];

export const useCheckBackupOnMount = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const analytics = useAnalytics();
    useEffect(() => {
        const startCheckBackup = async () => {
            const response = await dispatch(checkBackupThunk()).unwrap();

            if (response.success === true) {
                analytics.report({
                    type: events.deviceSettingsCheckBackupFinishedEvent.name,
                    payload: {
                        success: true,
                    },
                });
                navigation.navigate(DeviceCheckBackupStackRoutes.CheckBackupSuccess);

                return;
            }
            if (
                // The backup do no match.
                response.success === false &&
                response.error.code === 'Failure_ProcessError'
            ) {
                analytics.report({
                    type: events.deviceSettingsCheckBackupFinishedEvent.name,
                    payload: {
                        success: false,
                    },
                });
                navigation.navigate(DeviceCheckBackupStackRoutes.CheckBackupFail);

                return;
            }
            if (response.error.code && DEFINITIVE_ERRORS.includes(response.error.code)) return;

            startCheckBackup(); // In case any other error occurs, retry the check.
        };
        startCheckBackup();

        // This use effect should be triggered only during the first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
