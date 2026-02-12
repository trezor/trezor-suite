import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import { selectIsDeviceBackupRequired, selectIsDeviceBackupUnfinished } from '@suite-common/device';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    useLastRouteName,
    useNavigationRouteMatch,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';

import { DeviceDangerBannerCause, deviceDangerBannerAtom } from '../deviceAtoms';
import {
    selectFirmwareRevisionCheckErrorIfEnabled,
    selectIsSkippedRevisionCheckError,
} from '../selectors';

export const useRenderDeviceDangerBanner = () => {
    const setBannerVariant = useSetAtom(deviceDangerBannerAtom);
    const navigation = useNavigation();
    const lastRoute = useLastRouteName();
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const isSkippedRevisionCheckError = useSelector(selectIsSkippedRevisionCheckError);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);

    const isBannerExtended = useNavigationRouteMatch([
        HomeStackRoutes.Home,
        AppTabsRoutes.HomeStack,
    ]);

    const isDeviceOnboardingStackFocused = lastRoute === RootStackRoutes.DeviceOnboardingStack;
    const isRouteExcluded =
        useNavigationRouteMatch([
            RootStackRoutes.DeviceCompromisedModal,
            RootStackRoutes.BackupFailedModal,
        ]) || isDeviceOnboardingStackFocused;

    useEffect(() => {
        let dangerCause: DeviceDangerBannerCause | undefined;

        if (revisionCheckError) {
            dangerCause = 'device-compromised';
        } else if (isDeviceBackupUnfinished) {
            dangerCause = 'backup-failed';
        } else if (isDeviceBackupRequired) {
            dangerCause = 'backup-needed';
        }

        const variant = isBannerExtended ? 'extended' : 'brief';

        if (
            !isOnboardingFinished ||
            isRouteExcluded ||
            !dangerCause ||
            isSkippedRevisionCheckError
        ) {
            return setBannerVariant(null);
        }

        if (dangerCause === 'device-compromised') {
            if (revisionCheckError === 'other-error') {
                return setBannerVariant({ variant: 'other-error', cause: 'device-compromised' });
            }
        }

        return setBannerVariant({ variant, cause: dangerCause });
    }, [
        revisionCheckError,
        isSkippedRevisionCheckError,
        isDeviceBackupUnfinished,
        isDeviceBackupRequired,
        isOnboardingFinished,
        setBannerVariant,
        navigation,
        lastRoute,
        isBannerExtended,
        isRouteExcluded,
    ]);
};
