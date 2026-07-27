import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import { selectIsDeviceBackupRequired, selectIsDeviceBackupUnfinished } from '@suite-common/device';
import {
    getIsSkippedRevisionCheckError,
    revisionCheckErrorScenarios,
} from '@suite-common/firmware-authenticity';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    useLastRouteName,
    useNavigationRouteMatch,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { type FirmwareRevisionCheckError } from '@trezor/connect';

import { type DeviceDangerBannerCause, deviceDangerBannerAtom } from '../deviceAtoms';
import { selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled } from '../selectors';

/**
 * On mobile, we should skip revision check errors that are defined as skipped, but also the offline error,
 * because its banner is rendered separately in useIsOfflineBannerVisible.
 * So consider it skipped when rendering the banner centrally.
 */
const getShouldSkipRevisionCheckError = (
    revisionCheckError: FirmwareRevisionCheckError | null,
): boolean => {
    if (revisionCheckError === null) return false;
    if (getIsSkippedRevisionCheckError(revisionCheckError)) return true;

    return (
        revisionCheckError === 'cannot-perform-check-offline' &&
        // if TS throws error, it means that the aforementioned logic is no longer valid, and this function should be removed
        revisionCheckErrorScenarios[revisionCheckError].type === 'softWarning'
    );
};

export const useRenderDeviceDangerBanner = () => {
    const setBannerVariant = useSetAtom(deviceDangerBannerAtom);
    const navigation = useNavigation();
    const lastRoute = useLastRouteName();
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const revisionCheckError = useSelector(selectSelectedDeviceFirmwareRevisionCheckErrorIfEnabled);
    const isSkippedRevisionCheckError = getShouldSkipRevisionCheckError(revisionCheckError);
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
