import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigationState } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import {
    selectIsDeviceBackupRequired,
    selectIsDeviceBackupUnfinished,
} from '@suite-common/wallet-core';
import {
    DeviceDangerBannerCause,
    deviceDangerBannerAtom,
    revisionCheckErrorScenarios,
    selectFirmwareRevisionCheckErrorIfEnabled,
} from '@suite-native/device';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    useNavigationRouteMatch,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';

export const useRenderDeviceDangerBanner = () => {
    const setBannerVariant = useSetAtom(deviceDangerBannerAtom);
    const lastRoute = useNavigationState(state => state?.routes.at(-1)?.name);
    const isDeviceOnboardingStackFocused = lastRoute === RootStackRoutes.DeviceOnboardingStack;

    const isRouteExcluded =
        useNavigationRouteMatch([
            RootStackRoutes.DeviceCompromisedModal,
            RootStackRoutes.BackupFailedModal,
        ]) || isDeviceOnboardingStackFocused;

    const isBannerExtended = useNavigationRouteMatch([
        AppTabsRoutes.HomeStack,
        HomeStackRoutes.Home,
    ]);

    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);

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
            (revisionCheckError &&
                revisionCheckErrorScenarios[revisionCheckError].type === 'skipped')
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
        isRouteExcluded,
        isBannerExtended,
        revisionCheckError,
        isDeviceBackupUnfinished,
        isDeviceBackupRequired,
        isOnboardingFinished,
        setBannerVariant,
    ]);
};
