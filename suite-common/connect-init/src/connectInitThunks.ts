import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
} from '@trezor/connect';
import { getSynchronize } from '@trezor/utils';
import { deviceConnectThunks } from '@suite-common/wallet-core';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { isDesktop, isNative } from '@trezor/env-utils';

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
            'rebootToBootloader',
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

        // note:
        // this way, for local development you will get http://localhost:8000/static/connect/workers/sessions-background-sharedworker.js which is still the not-shared shared-worker
        // meaning that testing it together with connect-explorer dev build (http://localhost:8088/workers/sessions-background-sharedworker.js) will not work locally.
        // in production however, suite and connect are served from the same domain (trezor.io, sldev.cz) so it will work as expected.
        let sessionsBackground: string | undefined;
        if (typeof window !== 'undefined' && !isNative()) {
            sessionsBackground =
                window.location.origin +
                resolveStaticPath(
                    'connect/workers/sessions-background-sharedworker.js',
                    `${process.env.ASSET_PREFIX || ''}`,
                );
        }

        // Duplicates `getBinFilesBaseUrlThunk`, because calling any other thunk would change store.getActions() history,
        // and it would be impossible to test this thunk in isolation (many unit tests depend on it).
        const binFilesBaseUrl = isDesktop()
            ? extra.selectors.selectDesktopBinDir(getState())
            : resolveStaticPath('connect/data');

        try {
            await TrezorConnect.init({
                ...connectInitSettings,
                binFilesBaseUrl,
                pendingTransportEvent: selectIsPendingTransportEvent(getState()),
                transports: selectDebugSettings(getState()).transports,
                _sessionsBackgroundUrl: sessionsBackground,
                // debug: true, // Enable debug logs in TrezorConnect
                debug: true, // Enable debug logs in TrezorConnect
                thp: {
                    hostName: 'TrezorConnect',
                    staticKeys: '0007070707070707070707070707070707070707070707070707070707070747',
                    knownCredentials: [],
                    pairingMethods: ['CodeEntry', 'QrCode', 'NFC_Unidirectional'] as any,
                },
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
