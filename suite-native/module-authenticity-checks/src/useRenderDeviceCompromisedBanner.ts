import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import {
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

import { deviceCompromisedBannerAtom } from './DeviceCompromisedBannerAtoms';

export const useRenderDeviceCompromisedBanner = () => {
    const isRouteExcluded = useNavigationRouteMatch(RootStackRoutes.DeviceCompromisedModal);
    // need to match both; see note in hook definition
    const isExtendedBanner = useNavigationRouteMatch([
        AppTabsRoutes.HomeStack,
        HomeStackRoutes.Home,
    ]);

    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const revisionCheckError = useSelector(selectFirmwareRevisionCheckErrorIfEnabled);

    const setBannerVariant = useSetAtom(deviceCompromisedBannerAtom);

    useEffect(() => {
        if (
            !isOnboardingFinished ||
            isRouteExcluded ||
            revisionCheckError === null ||
            revisionCheckErrorScenarios[revisionCheckError].type === 'skipped'
        ) {
            return setBannerVariant('none');
        }

        if (revisionCheckError === 'other-error') {
            return setBannerVariant('other-error');
        }

        setBannerVariant(isExtendedBanner ? 'extended' : 'brief');
    }, [
        isRouteExcluded,
        isExtendedBanner,
        revisionCheckError,
        setBannerVariant,
        isOnboardingFinished,
    ]);
};
