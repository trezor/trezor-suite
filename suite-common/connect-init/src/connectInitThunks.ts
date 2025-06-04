import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    deviceConnectThunks,
    selectDevices,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE,
    DEVICE_EVENT,
    Device,
    TRANSPORT_EVENT,
    UI_EVENT,
} from '@trezor/connect';
import { isDesktop, isNative } from '@trezor/env-utils';
import { DATA_URL } from '@trezor/urls';
import { getSynchronize } from '@trezor/utils';

import { cardanoConnectPatch } from './cardanoConnectPatch';

const CONNECT_INIT_MODULE = '@common/connect-init';

// If you are looking where connectInitSettings is defined, it is defined in packages/suite/src/support/extraDependencies.ts
// or in suite-native/state/src/extraDependencies.ts depends on which platform this connectInitThunk runs.

export const connectInitThunk = createThunk<
    void,
    | {
          [key in typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED]?: (
              device: Device,
              prevConnectedDevices: TrezorDevice[],
          ) => void;
      }
    | void,
    void
>(`${CONNECT_INIT_MODULE}/initThunk`, async (connectInitHooks, { dispatch, getState, extra }) => {
    const {
        selectors: { selectIsPendingTransportEvent, selectDebugSettings },
        actions: { lockDevice },
        utils: { connectInitSettings },
    } = extra;

    const getEnabledNetworks = () => selectEnabledNetworks(getState());

    // set event listeners and dispatch as
    TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
        if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
            // This special case here allows us to "inject" extra data into action's payload
            // and change the type of the action (in this case DeviceEvent type !== Redux Action type)
            const connectedDevices = selectDevices(getState());
            dispatch(deviceConnectThunks({ type: eventData.type, device: eventData.payload }));

            connectInitHooks?.[eventData.type]?.(eventData.payload, connectedDevices);
        } else {
            // dispatch event as action
            dispatch({ type: eventData.type, payload: eventData.payload });
        }
    });

    TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
        if (action.type === 'ui-select_device') {
            // this is why you received the ui-select_device event.
            console.warn(
                'Hey, it looks like you called a TrezorConnect method without providing device property.',
            );
        }

        if (
            action.type === 'ui-close_window'
            // && getState().wallet.discovery[getState().device?.selectedDevice?.path]?.status ==='progress'
        ) {
            // return;
        }
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    const synchronize = getSynchronize();

    const wrappedMethods: Array<keyof typeof TrezorConnect> = [
        'applySettings',
        'authenticateDevice',
        'authorizeCoinjoin',
        'backupDevice',
        'cancelCoinjoinAuthorization',
        'cardanoGetAddress',
        'cardanoGetPublicKey',
        'cardanoSignTransaction',
        'changePin',
        'cipherKeyValue',
        'discoverAccounts',
        'ethereumGetAddress',
        'ethereumSignTransaction',
        'getAddress',
        'getDeviceState',
        'getFeatures',
        'getOwnershipProof',
        'getPublicKey',
        'pushTransaction',
        'recoveryDevice',
        'resetDevice',
        'rippleGetAddress',
        'rippleSignTransaction',
        'setBusy',
        'showDeviceTutorial',
        'signTransaction',
        'solanaGetAddress',
        'solanaSignTransaction',
        'unlockPath',
        'wipeDevice',
    ] as const;

    wrappedMethods.forEach(key => {
        // typescript complains about params and return type, need to be "any"
        const original: any = TrezorConnect[key];
        if (!original) return;
        (TrezorConnect[key] as any) = async (params: any) => {
            dispatch(lockDevice(true));
            const result = await synchronize(() => original(params));
            dispatch(lockDevice(false));

            return result;
        };
    });

    cardanoConnectPatch(getEnabledNetworks);

    // suite-web                                               connect (explorer)                           webusb sync
    // ======================================================  ====================                         ====================
    // localhost:8000                                          localhost:8088                               NO
    // https://dev.suite.sldev.cz/suite-web/develop/web/       https://dev.suite.sldev.cz/connect/develop/  YES - connect
    // suite.trezor.io/web                                     connect.trezor.io/9(x.y)/                    YES - connect

    let _sessionsBackgroundUrl: string | null = null;

    if (typeof window !== 'undefined' && !isNative()) {
        if (window.location.origin.includes('localhost')) {
            _sessionsBackgroundUrl = null;
        } else if (window.location.origin.endsWith('dev.suite.sldev.cz')) {
            // we are expecting accompanying connect build at specified location
            const assetPrefixArr = (process.env.ASSET_PREFIX || '').split('/').filter(Boolean);
            const relevantSegments = assetPrefixArr
                .map((segment, index) => {
                    const first = index === 0;
                    const last = index === assetPrefixArr.length - 1;
                    if (segment === 'suite-web' && first) return 'connect';
                    if (segment === 'web' && last) return null;

                    return segment;
                })
                .filter(Boolean);

            _sessionsBackgroundUrl = `${window.location.origin}/${relevantSegments.join('/')}/workers/sessions-background-sharedworker.js`;
        } else {
            _sessionsBackgroundUrl =
                'https://connect.trezor.io/9/workers/sessions-background-sharedworker.js';
        }
    }

    const binFilesBaseUrl = isDesktop()
        ? extra.selectors.selectDesktopBinDir(getState())
        : DATA_URL;

    const { transports, showConnectLogs } = selectDebugSettings(getState());
    try {
        await TrezorConnect.init({
            ...connectInitSettings,
            binFilesBaseUrl,
            pendingTransportEvent: selectIsPendingTransportEvent(getState()),
            transports,
            _sessionsBackgroundUrl,
            debug: showConnectLogs,
        });
    } catch (error) {
        let formattedError: string;
        if (typeof error === 'string') {
            formattedError = error;
        } else {
            formattedError = error.code ? `${error.code}: ${error.message}` : error.message;
        }
        throw new Error(formattedError);
    }
});
