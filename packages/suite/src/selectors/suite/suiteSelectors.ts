import { type RouterRootState, selectRouter } from '@suite/router';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type TransportInfo } from '@trezor/connect';

import { type SuiteRootState, type SuiteState } from 'src/reducers/suite/suiteReducer';
import { type PrerequisiteType, type TrezorDevice } from 'src/types/suite';
import { getPrerequisiteName, isPrerequisiteGloballyExcluded } from 'src/utils/suite/prerequisites';

export const selectIsSuiteOnline = (state: SuiteRootState) => state.suite.online;
export const selectSuiteLifecycle = (state: SuiteRootState) => state.suite.lifecycle;
export const selectSuiteLifecycleStatus = (state: SuiteRootState) => state.suite.lifecycle.status;
export const selectSuiteTransport = (state: SuiteRootState) => state.suite.transport;
export const selectRecentlyDisconnectedDevice = (state: SuiteRootState) =>
    state.suite.recentlyDisconnectedDevice;
export const selectSeenDisconnectNotificationForDeviceIds = (state: {
    suite: Pick<SuiteState, 'seenDisconnectNotificationForDeviceIds'>;
}) => state.suite.seenDisconnectNotificationForDeviceIds;
export const selectEvmSettings = (state: { suite: Pick<SuiteState, 'evmSettings'> }) =>
    state.suite.evmSettings;
export const selectConfirmExplanationModalClosed = (state: SuiteRootState) =>
    state.suite.evmSettings.confirmExplanationModalClosed;
export const selectExplanationBannerClosed = (state: SuiteRootState) =>
    state.suite.evmSettings.explanationBannerClosed;
export const selectSendFormPrefill = (state: SuiteRootState) => state.suite.prefillFields.sendForm;
export const selectTransactionHistoryPrefill = (state: SuiteRootState) =>
    state.suite.prefillFields.transactionHistory;

export const selectSuiteTransports = (state: SuiteRootState) =>
    state.suite.transport?.transports.map(({ type, version }) => ({ type, version }));
export const selectIsTransportInitialized = (state: SuiteRootState) => !!state.suite.transport;
export const selectActiveTransports = (state: SuiteRootState) =>
    returnStableArrayIfEmpty(state.suite.transport?.transports);
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

// TODO use selectDeviceByDeviceRef from wallet-core; currently WIP in https://github.com/trezor/trezor-suite/pull/20955
export const selectRecentlyConnectedDevice = (
    state: SuiteRootState & DeviceRootState,
): TrezorDevice | undefined =>
    state.suite.recentlyConnectedDeviceRef !== null
        ? state.device.devices.find(
              device =>
                  state.suite.recentlyConnectedDeviceRef === device?.id ||
                  state.suite.recentlyConnectedDeviceRef === device.path,
          )
        : undefined;
