import { getPrerequisiteName, isPrerequisiteGloballyExcluded } from '@suite/prerequisites';
import { type RouterRootState, selectRouter } from '@suite/router';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type TransportInfo } from '@trezor/connect';

import { type SuiteRootState } from 'src/reducers/suite/suiteReducer';
import {
    type AppState,
    type PrerequisiteType,
    TorStatus,
    type TrezorDevice,
} from 'src/types/suite';
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

    const prerequisite = getPrerequisiteName({
        isAppRouteUnknown: router.app === 'unknown',
        device,
        hasNoTransport: !transport?.transports.length,
    });
    const isExcluded = isPrerequisiteGloballyExcluded({
        isSettingsAppRoute: router.app === 'settings',
        prerequisite,
    });

    if (prerequisite === null || isExcluded) {
        return null;
    }

    return prerequisite;
};

// TODO use selectDeviceByDeviceRef from wallet-core; currently WIP in https://github.com/trezor/trezor-suite/pull/20955
export const selectRecentlyConnectedDevice = (state: AppState): TrezorDevice | undefined =>
    state.suite.recentlyConnectedDeviceRef !== null
        ? state.device.devices.find(
              device =>
                  state.suite.recentlyConnectedDeviceRef === device?.id ||
                  state.suite.recentlyConnectedDeviceRef === device.path,
          )
        : undefined;
