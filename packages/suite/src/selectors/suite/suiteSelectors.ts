import type { ExperimentalFeature } from '@suite/experimental';
import { RouterRootState, selectRouter } from '@suite/router';
import { DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { TransportInfo } from '@trezor/connect';

import { SUITE } from 'src/actions/suite/constants';
import { SuiteRootState } from 'src/reducers/suite/suiteReducer';
import { AppState, PrerequisiteType, TorStatus, TrezorDevice } from 'src/types/suite';
import { getPrerequisiteName, isPrerequisiteGloballyExcluded } from 'src/utils/suite/prerequisites';
import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';

export const selectIsSuiteOnline = (state: SuiteRootState) => state.suite.online;

export const selectTorState = (state: SuiteRootState) => {
    const { torStatus, torBootstrap } = state.suite;

    return {
        torStatus,
        isTorEnabled: getIsTorEnabled(torStatus),
        isTorLoading: getIsTorLoading(torStatus),
        isTorError: torStatus === TorStatus.Error,
        isTorDisabling: torStatus === TorStatus.Disabling,
        isTorDisabled: torStatus === TorStatus.Disabled,
        isTorEnabling: torStatus === TorStatus.Enabling,
        torBootstrap,
    };
};

export const selectTorOnionLinks = (state: SuiteRootState) => state.suite.settings.torOnionLinks;

// TODO: use this selector in all places where we need to check if debug mode is active
export const selectIsDebugModeActive = (state: SuiteRootState) =>
    state.suite.settings.debug.showDebugMenu;
export const selectLanguage = (state: SuiteRootState) => state.suite.settings.language;
export const selectAutodetectLanguage = (state: SuiteRootState) =>
    state.suite.settings.autodetect.language;
export const selectTheme = (state: SuiteRootState) => state.suite.settings.theme.variant;
export const selectAutodetectTheme = (state: SuiteRootState) =>
    state.suite.settings.autodetect.theme;
export const selectAddressDisplayType = (state: SuiteRootState) =>
    state.suite.settings.addressDisplayType;
export const selectIsDeviceLocked = (state: SuiteRootState) =>
    !!state.suite.locks[SUITE.LOCK_TYPE.DEVICE];
export const selectIsDeviceOrUiLocked = (state: SuiteRootState) =>
    !!state.suite.locks[SUITE.LOCK_TYPE.DEVICE] || !!state.suite.locks[SUITE.LOCK_TYPE.UI];
export const selectIsRouterLocked = (state: SuiteRootState) =>
    !!state.suite.locks[SUITE.LOCK_TYPE.ROUTER];
export const selectIsRouterOrUiLocked = (state: SuiteRootState) =>
    !!state.suite.locks[SUITE.LOCK_TYPE.ROUTER] || !!state.suite.locks[SUITE.LOCK_TYPE.UI];

export const selectSuiteTransports = (state: SuiteRootState) =>
    state.suite.transport?.transports.map(({ type, version }) => ({ type, version }));
export const selectIsTransportInitialized = (state: SuiteRootState) => !!state.suite.transport;
export const selectActiveTransports = (state: SuiteRootState) =>
    state.suite.transport?.transports ?? [];
export const selectHasActiveTransport = (state: SuiteRootState) =>
    !!state.suite.transport?.transports.length;
export const selectHasTransportOfType = (type: TransportInfo['type']) => (state: SuiteRootState) =>
    state.suite.transport?.transports.some(t => t.type === type) ?? false;
export const selectTransportOfType = (type: TransportInfo['type']) => (state: SuiteRootState) =>
    state.suite.transport?.transports.find(t => t.type === type);

export const selectPrerequisite = (
    state: SuiteRootState & RouterRootState & DeviceRootState,
): PrerequisiteType | null => {
    const { transport } = state.suite;
    const device = selectSelectedDevice(state);
    const router = selectRouter(state);

    const prerequisite = getPrerequisiteName({ router, device, transport });
    const isExcluded = isPrerequisiteGloballyExcluded({ router, prerequisite });

    if (prerequisite === null || isExcluded) {
        return null;
    }

    return prerequisite;
};

export const selectIsTEXDashboardPromoBannerShown = (state: SuiteRootState) =>
    state.suite.flags.showTEXDashboardPromoBanner;
export const selectIsTS7DashboardPromoBannerShown = (state: SuiteRootState) =>
    state.suite.flags.showTS7DashboardPromoBanner;
export const selectIsSettingsDesktopAppPromoBannerShown = (state: SuiteRootState) =>
    state.suite.flags.showSettingsDesktopAppPromoBanner;
export const selectIsUnhideTokenModalShown = (state: SuiteRootState) =>
    state.suite.flags.showUnhideTokenModal;
export const selectIsCopyAddressModalShown = (state: SuiteRootState) =>
    state.suite.flags.showCopyAddressModal;
export const selectIsInitialRun = (state: SuiteRootState) => state.suite.flags.initialRun;
export const selectSuiteFlags = (state: SuiteRootState) => state.suite.flags;
export const selectHasExperimentalFeature =
    (feature: ExperimentalFeature) => (state: SuiteRootState) =>
        state.suite.settings.experimental?.includes(feature) ?? false;
export const selectIsDeviceAuthenticityCheckEnabled = (state: SuiteRootState) =>
    state.suite.settings.enabledSecurityChecks.deviceAuthenticity;
export const selectIsEntropyCheckEnabled = (state: SuiteRootState) =>
    state.suite.settings.enabledSecurityChecks.entropy;
export const selectIsFirmwareHashCheckEnabled = (state: SuiteRootState) =>
    state.suite.settings.enabledSecurityChecks.firmwareHash;
export const selectIsFirmwareRevisionCheckEnabled = (state: SuiteRootState) =>
    state.suite.settings.enabledSecurityChecks.firmwareRevision;
export const selectAreDeviceMetaChecksEnabled = (state: SuiteRootState) =>
    state.suite.settings.enabledSecurityChecks.deviceMeta;

// TODO use selectDeviceByDeviceRef from wallet-core; currently WIP in https://github.com/trezor/trezor-suite/pull/20955
export const selectRecentlyConnectedDevice = (state: AppState): TrezorDevice | undefined =>
    state.suite.recentlyConnectedDeviceRef !== null
        ? state.device.devices.find(
              device =>
                  state.suite.recentlyConnectedDeviceRef === device?.id ||
                  state.suite.recentlyConnectedDeviceRef === device.path,
          )
        : undefined;
