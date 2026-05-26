import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectDeviceStaticSessionId, selectIsDeviceConnected } from '@suite-common/device';
import { selectEnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types';
import { AnimatedFullAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useSuiteSyncErrorHandler } from '@suite-native/suite-sync';

import { selectShouldDisplaySuiteSyncAlert } from '../homescreenSelectors';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const SuiteSyncKeysAlert = () => {
    const { ensureWalletSuiteSyncOn } = useServices(selectEnsureWalletSuiteSyncOnDep);

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
            const result = await ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
                isWriteMode: false,
            });

            if (!result.success) {
                handleSuiteSyncError(result.error);
            }
        }
    }, [
        deviceStaticSessionId,
        ensureWalletSuiteSyncOn,
        handleSuiteSyncError,
        isDeviceConnected,
        navigation,
    ]);

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
