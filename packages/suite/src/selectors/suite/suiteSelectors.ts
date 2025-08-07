import type { TradingType } from '@suite-common/trading';
import { DeviceRootState, selectSelectedDevice } from '@suite-common/wallet-core';
import { TransportInfo } from '@trezor/connect';
import { versionUtils } from '@trezor/utils';

import { SUITE } from 'src/actions/suite/constants';
import { ExperimentalFeature } from 'src/constants/suite/experimental';
import { RouterRootState, selectRouter } from 'src/reducers/suite/routerReducer';
import { SuiteRootState } from 'src/reducers/suite/suiteReducer';
import { AppState, TorStatus } from 'src/types/suite';
import { getExcludedPrerequisites, getPrerequisiteName } from 'src/utils/suite/prerequisites';
import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';

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

// TODO: use this selector in all places where we need to check if debug mode is active
export const selectIsDebugModeActive = (state: SuiteRootState) =>
    state.suite.settings.debug.showDebugMenu;
export const selectLanguage = (state: SuiteRootState) => state.suite.settings.language;
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
export const selectIsTransportInitialized = (state: SuiteRootState) => !!state.suite.transport;
export const selectActiveTransports = (state: SuiteRootState) =>
    state.suite.transport?.transports ?? [];
export const selectHasActiveTransport = (state: SuiteRootState) =>
    !!state.suite.transport?.transports.length;
export const selectHasTransportOfType = (type: TransportInfo['type']) => (state: SuiteRootState) =>
    state.suite.transport?.transports.some(t => t.type === type) ?? false;
export const selectTransportOfType = (type: TransportInfo['type']) => (state: SuiteRootState) =>
    state.suite.transport?.transports.find(t => t.type === type);
export const selectUdevInstaller = (state: SuiteRootState) => state.suite.transport?.udev;

export const selectIsActionAbortable = (state: SuiteRootState) => {
    const bridge = state.suite.transport?.transports.find(t => t.type === 'BridgeTransport');

    // TODO abortable actions should be decided based on specific device's transport
    return !bridge || versionUtils.isNewerOrEqual(bridge.version as string, '2.0.31');
};

export const selectPrerequisite = (state: SuiteRootState & RouterRootState & DeviceRootState) => {
    const { transport } = state.suite;
    const device = selectSelectedDevice(state);
    const router = selectRouter(state);

    const excluded = getExcludedPrerequisites(router);
    const prerequisite = getPrerequisiteName({ router, device, transport });

    if (prerequisite === undefined) return;

    if (excluded.includes(prerequisite)) {
        return;
    }

    return prerequisite;
};

export const selectIsTEXDashboardPromoBannerShown = (state: SuiteRootState) =>
    state.suite.flags.showTEXDashboardPromoBanner;
export const selectIsSettingsDesktopAppPromoBannerShown = (state: SuiteRootState) =>
    state.suite.flags.showSettingsDesktopAppPromoBanner;
export const selectIsUnhideTokenModalShown = (state: SuiteRootState) =>
    state.suite.flags.showUnhideTokenModal;
export const selectIsCopyAddressModalShown = (state: SuiteRootState) =>
    state.suite.flags.showCopyAddressModal;
export const selectIsInitialRun = (state: SuiteRootState) => state.suite.flags.initialRun;
export const selectIsLoggedOut = (state: SuiteRootState & DeviceRootState) =>
    selectIsInitialRun(state) || state.device?.selectedDevice?.mode !== 'normal';
export const selectSuiteFlags = (state: SuiteRootState) => state.suite.flags;
export const selectSuiteSettings = (state: SuiteRootState) => ({
    defaultWalletLoading: state.suite.settings.defaultWalletLoading,
});
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
export const selectIsAutoEjectEnabled = (state: SuiteRootState) => state.suite.settings.autoEject;
export const selectIsTradingTermsDismissed = (state: AppState, tradingType: TradingType): boolean =>
    !!state.suite.dismissedTradingTerms?.[tradingType];
