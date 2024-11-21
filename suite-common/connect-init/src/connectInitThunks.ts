import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE,
    DEVICE_EVENT,
    ERRORS,
    TRANSPORT_EVENT,
    UI_EVENT,
} from '@trezor/connect';
import { DATA_URL } from '@trezor/urls';
import { createDeferred, getSynchronize } from '@trezor/utils';
import { deviceConnectThunks, selectDevice } from '@suite-common/wallet-core';
import { isDesktop, isNative } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';
import { serializeError } from '@trezor/connect/src/constants/errors';

import { cardanoConnectPatch } from './cardanoConnectPatch';

const CONNECT_INIT_MODULE = '@common/connect-init';

// If you are looking where connectInitSettings is defined, it is defined in packages/suite/src/support/extraDependencies.ts
// or in suite-native/state/src/extraDependencies.ts depends on which platform this connectInitThunk runs.

export const connectInitThunk = createThunk(
    `${CONNECT_INIT_MODULE}/initThunk`,
    async (_, { dispatch, getState, extra }) => {
        const {
            selectors: {
                selectEnabledNetworks,
                selectIsPendingTransportEvent,
                selectDebugSettings,
            },
            actions: { lockDevice },
            utils: { connectInitSettings },
        } = extra;

        const getEnabledNetworks = () => selectEnabledNetworks(getState());

        // set event listeners and dispatch as
        TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
            // dispatch event as action

            if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
                dispatch(deviceConnectThunks({ type: eventData.type, device: eventData.payload }));
            } else {
                dispatch({ type: eventData.type, payload: eventData.payload });
            }
        });

        TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
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

        try {
            await TrezorConnect.init({
                ...connectInitSettings,
                binFilesBaseUrl,
                pendingTransportEvent: selectIsPendingTransportEvent(getState()),
                transports: selectDebugSettings(getState()).transports,
                _sessionsBackgroundUrl,
                // debug: true, // Enable debug logs in TrezorConnect
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
    },
);

export const connectPopupCallThunk = createThunk(
    `${CONNECT_INIT_MODULE}/callThunk`,
    async (
        {
            id,
            method,
            payload,
            processName,
            origin,
        }: {
            id: number;
            method: string;
            payload: any;
            processName?: string;
            origin?: string;
        },
        { dispatch, getState, extra },
    ) => {
        try {
            const device = selectDevice(getState());

            if (!device) {
                console.error('Device not found');

                // TODO: wait for device selection and continue
                throw ERRORS.TypedError('Device_NotFound');
            }

            // @ts-expect-error: method is dynamic
            const methodInfo = await TrezorConnect[method]({
                ...payload,
                __info: true,
            });
            if (!methodInfo.success) {
                throw methodInfo;
            }

            const confirmation = createDeferred();
            dispatch(extra.actions.lockDevice(true));
            dispatch(
                extra.actions.openModal({
                    type: 'connect-popup',
                    onCancel: () => confirmation.reject(ERRORS.TypedError('Method_Cancel')),
                    onConfirm: () => confirmation.resolve(),
                    method: methodInfo.payload.info,
                    processName,
                    origin,
                }),
            );
            await confirmation.promise;
            dispatch(extra.actions.lockDevice(false));

            // @ts-expect-error: method is dynamic
            const response = await TrezorConnect[method]({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                ...payload,
            });

            dispatch(extra.actions.onModalCancel());

            desktopApi.connectPopupResponse({
                ...response,
                id,
            });
        } catch (error) {
            console.error('connectPopupCallThunk', error);
            desktopApi.connectPopupResponse({
                success: false,
                payload: serializeError(error),
                id,
            });
        }
    },
);

export const connectPopupInitThunk = createThunk(
    `${CONNECT_INIT_MODULE}/initPopupThunk`,
    async (_, { dispatch }) => {
        if (desktopApi.available && (await desktopApi.connectPopupEnabled())) {
            desktopApi.on('connect-popup/call', params => {
                dispatch(connectPopupCallThunk(params));
            });
            desktopApi.connectPopupReady();
        }
    },
);
