import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceStaticSessionId, selectIsDeviceConnected } from '@suite-common/device';
import { AnimatedFullAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useSuiteSyncErrorHandler } from '@suite-native/labeling';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useNativeServices } from '@suite-native/services';

import { selectShouldDisplaySuiteSyncAlert } from '../homescreenSelectors';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const SuiteSyncKeysAlert = () => {
    const { suiteSync } = useNativeServices();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const shouldDisplaySuiteSyncAlert = useSelector(selectShouldDisplaySuiteSyncAlert);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);
    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();

    const navigation = useNavigation<NavigationProp>();

    const allowSuiteSyncForWallet = useCallback(async () => {
        if (!deviceStaticSessionId) return;

        if (!isDeviceConnected) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            });
        } else {
            const result = await suiteSync.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
                isWriteMode: false,
            });

            if (!result.success) {
                handleSuiteSyncError(result.error);
            }
        }
    }, [deviceStaticSessionId, handleSuiteSyncError, isDeviceConnected, navigation, suiteSync]);

    if (!shouldDisplaySuiteSyncAlert) return null;

    return (
        <AnimatedFullAlertBox
            variant="info"
            title={<Translation id="moduleHome.suiteSyncAlert.title" />}
            description={
                <Translation
                    id={
                        isDeviceConnected
                            ? 'moduleHome.suiteSyncAlert.description'
                            : 'moduleHome.suiteSyncAlert.connectDescription'
                    }
                />
            }
            primaryButtonLabel={
                <Translation
                    id={
                        isDeviceConnected
                            ? 'moduleHome.suiteSyncAlert.button'
                            : 'moduleHome.suiteSyncAlert.connectButton'
                    }
                />
            }
            onPressPrimaryButton={allowSuiteSyncForWallet}
            marginHorizontal="sp16"
        />
    );
};
