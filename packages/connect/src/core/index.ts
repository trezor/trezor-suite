/* eslint-disable @typescript-eslint/no-use-before-define */
import EventEmitter from 'events';

import {
    CORE_CALL,
    CORE_EVENT,
    DEVICE,
    POPUP,
    RESPONSE_EVENT,
    UI_REQUEST,
    UI_RESPONSE,
    createDeviceMessage,
    createResponseMessage,
    createTransportMessage,
    createUiMessage,
} from '@trezor/connect-common';
import type {
    ConnectSettings,
    CoreCallMessage,
    CoreEventMessage,
    CoreRequestMessage,
    DeviceIdentity,
    TransportInfo,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { parseLocalFirmwares } from '@trezor/connect-common/src/data/connectSettings';
import {
    type LogWriter,
    enableLog,
    initLog,
    setLogWriter,
} from '@trezor/connect-common/src/utils/debug';
import { TRANSPORT, TRANSPORT_ERROR } from '@trezor/transport';
import { createDeferred, createLazy, getSynchronize, throwError } from '@trezor/utils';

import type { AbstractMethod } from './AbstractMethod';
import { getMethod } from './method';
import { onCallFirmwareUpdate } from './onCallFirmwareUpdate';
import { dispose as disposeBackend } from '../backend/BlockchainLink';
import { initializeFirmwareConfig } from '../data/firmwareInfo';
import * as firmwareReleaseStore from '../data/firmwareReleaseStore';
import * as localFirmwareStore from '../data/localFirmwareStore';
import { loadProtobufModules } from '../data/protobufLoader';
import * as settingsStore from '../data/settingsStore';
import type { Device, DeviceEvents } from '../device/Device';
import type { IDeviceList } from '../device/DeviceList';
import { DeviceList, assertDeviceListConnected } from '../device/DeviceList';
import { validateState } from '../device/workflow/validateState';
import { createUiPromiseManager } from '../utils/uiPromiseManager';

// custom log
const _log = initLog('Core');

type CoreContext = ReturnType<Core['getCoreContext']>;

/**
 * Find device by device path. Returned device may be unacquired.
 * @param {AbstractMethod} method
 * @returns {Promise<Device>}
 * @memberof Core
 */
const selectDevice = ({ deviceList }: CoreContext, methodCallDevice?: DeviceIdentity) => {
    assertDeviceListConnected(deviceList);

    let device: Device | typeof undefined;

    if (methodCallDevice?.state?.staticSessionId) {
        device = deviceList.getDeviceByStaticState(methodCallDevice.state.staticSessionId);
    }
    if (!device && methodCallDevice?.path) {
        device = deviceList.getDeviceByPath(methodCallDevice.path);
    }
    if (!device) {
        device = deviceList.getOnlyDevice();
    }
    if (!device) {
        throw ERRORS.TypedError('Device_NotFound');
    }

    return device;
};

/**
 * This function will run inside Device.run() after device will be acquired and initialized
 */
const inner = async (context: CoreContext, method: AbstractMethod<any>, device: Device) => {
    const { uiPromises, sendCoreMessage } = context;

    const firmwareException = method.checkFirmwareRange();
    if (firmwareException) {
        // return error if not using popup
        return Promise.reject(ERRORS.TypedError('Device_FwException', firmwareException));
    }

    // check if device is in unexpected mode [bootloader, not-initialized, required firmware]
    const unexpectedMode = device.hasUnexpectedMode(method.allowDeviceMode);
    if (unexpectedMode) {
        // throw error if not using popup
        return Promise.reject(ERRORS.TypedError('Device_ModeException', unexpectedMode));
    }

    method.checkDeviceCapability();

    const deviceNeedsBackup = device.features.backup_availability === 'Required';
    if (deviceNeedsBackup) {
        if (method.confirmMissingBackup) {
            // initialize user response promise
            const uiPromise = uiPromises.create(UI_RESPONSE.RECEIVE_CONFIRMATION, device);

            // request confirmation view
            sendCoreMessage(
                createUiMessage(
                    UI_REQUEST.REQUEST_CONFIRMATION,
                    {
                        view: 'no-backup',
                    },
                    uiPromise.requestId,
                ),
            );

            // wait for user action
            const permitted = await uiPromise.promise.then(({ payload }) => payload);

            if (!permitted) {
                // interrupt process and go to "final" block
                return Promise.reject(ERRORS.TypedError('Method_PermissionsNotGranted'));
            }
        }
        // show notification
        sendCoreMessage(createUiMessage(UI_REQUEST.DEVICE_NEEDS_BACKUP, device.toMessageObject()));
    }

    // notify if firmware is outdated but not required
    if (device.firmwareStatus === 'outdated') {
        // show notification
        sendCoreMessage(createUiMessage(UI_REQUEST.FIRMWARE_OUTDATED, device.toMessageObject()));
    }

    // Make sure that device will display pin/passphrase
    if (method.useDeviceState) {
        await validateState({
            device,
            method,
            signal: context.signal,
            sendCoreMessage,
        });
    }

    // run method
    try {
        const response = await method.run({ sendCoreMessage, createUiPromise: uiPromises.create });

        return createResponseMessage(method.responseID, true, response, {
            path: device.getUniquePath(),
            state: device.getState(),
            instance: device.getInstance(),
        });
    } catch (error) {
        return Promise.reject(error);
    }
};

/**
 * Processing incoming message.
 * This method is async that's why it returns Promise but the real response is passed by sendCoreMessage(ResponseMessage)
 * @param {CoreMessage} message
 * @returns {Promise<void>}
 * @memberof Core
 */
const onCall = async (context: CoreContext, message: CoreCallMessage) => {
    if (!message.id || !message.payload || message.type !== CORE_CALL) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'onCall: message.id or message.payload is missing',
        );
    }

    const {
        uiPromises,
        callMethods,
        methodSynchronize,
        resolveWaitForFirstMethod,
        sendCoreMessage,
    } = context;
    const responseID = message.id;

    // find method and parse incoming params
    let method: AbstractMethod<any>;
    try {
        method = await methodSynchronize(async () => {
            _log.debug('loading method...');
            const method2 = await getMethod(message);
            _log.debug('method selected', method2.name);

            await method2.initAsync?.();

            return method2;
        });
        resolveWaitForFirstMethod();
        callMethods.push(method);
    } catch (error) {
        sendCoreMessage(createResponseMessage(responseID, false, { error }));

        return Promise.resolve();
    }

    if (message.payload.__info) {
        const response = method.getMethodInfo();

        if (message.payload.__precomposed) {
            response.precomposed = method.payloadToPrecomposed();
        }
        sendCoreMessage(createResponseMessage(method.responseID, true, response));

        return Promise.resolve();
    }

    // this method is not using the device, there is no need to acquire
    if (!method.useDevice) {
        try {
            const response = await method.run({
                sendCoreMessage,
                createUiPromise: uiPromises.create,
            });
            sendCoreMessage(createResponseMessage(method.responseID, true, response));
        } catch (error) {
            sendCoreMessage(createResponseMessage(method.responseID, false, { error }));
        }

        return Promise.resolve();
    }

    return await onCallDevice(context, message, method);
};

const onCallDevice = async (
    context: CoreContext,
    message: CoreCallMessage,
    method: AbstractMethod<any>,
): Promise<void> => {
    const { deviceList, callMethods, sendCoreMessage } = context;
    const responseID = message.id;
    const { env, transports, pendingTransportEvent } = settingsStore.get();

    if (!deviceList.isConnected() && !deviceList.pendingConnection()) {
        // transport is missing try to initialize it once again
        deviceList.init({ transports, pendingTransportEvent });
    }
    await deviceList.pendingConnection();

    const shouldRetry = ['web', 'webextension'].includes(env);
    // find device
    let tempDevice: Device | undefined;
    while (!tempDevice) {
        try {
            tempDevice = selectDevice(context, message.payload.device);
        } catch (error) {
            if (error.code === 'Transport_Missing') {
                // show message about transport
                sendCoreMessage(createUiMessage(UI_REQUEST.TRANSPORT));

                // Retry selectDevice again
                // NOTE: this should change after multi-transports refactor, where transport will be always alive
                if (deviceList.pendingConnection() && shouldRetry) {
                    while (deviceList.pendingConnection()) {
                        await deviceList.pendingConnection();
                    }
                    continue;
                }
            }
            // TODO: this should not be returned here before user agrees on "read" perms...
            sendCoreMessage(createResponseMessage(responseID, false, { error }));
            throw error;
        }
    }
    const device = tempDevice;

    method.setDevice(device);

    // find pending calls to this device
    const previousCall = callMethods.filter(
        call =>
            call &&
            call !== method &&
            call.device?.getUniquePath() === method.device?.getUniquePath(),
    );
    if (previousCall.length > 0 && method.overridePreviousCall) {
        // set flag for each pending method
        previousCall.forEach(call => {
            call.overridden = true;
        });
        // interrupt potential communication with device. this should throw error in try/catch block below
        // this error will apply to the last item of pending methods
        const overrideError = ERRORS.TypedError('Method_Override');
        await device.interrupt(overrideError); // TODO not necessary to release session here

        // if current method was overridden while waiting for device.override result
        // return response with status false
        if (method.overridden) {
            sendCoreMessage(
                createResponseMessage(method.responseID, false, { error: overrideError }),
            );
            throw overrideError;
        }
    } else if (device.currentRun) {
        if (device.isUnacquired()) {
            // corner case
            // device didn't finish loading for the first time. @see DeviceList._createAndSaveDevice
            // wait for self-release and then carry on
            await device.currentRun;
        } else {
            sendCoreMessage(
                createResponseMessage(responseID, false, {
                    error: ERRORS.TypedError('Device_CallInProgress'),
                }),
            );
            throw ERRORS.TypedError('Device_CallInProgress');
        }
    }

    // set device instance. default is 0
    device.setInstance(message.payload.device?.instance);
    device.setState(method.deviceState);

    // device is available
    // set public variables, listeners and run method
    registerDeviceEvents(context, method)(device);

    let messageResponse: CoreEventMessage;

    try {
        const innerAction = () =>
            inner(context, method, device).then(response => {
                messageResponse = response;
            });

        await device.run(innerAction, {
            keepSession: method.keepSession,
            skipFinalReload: method.skipFinalReload,
            useCardanoDerivation: method.useCardanoDerivation,
        });
    } catch (error) {
        // just a log proving that cause propagates all the way up
        if (error.cause) {
            _log.debug('device.run error caught, caused by:', error.cause);
        }
        // corner case: Device was disconnected during authorization
        // this device_id needs to be stored and penalized with delay on future connection
        // this solves issue with U2F login (leaves space for requests from services which aren't using trezord)
        if (error.code === 'Device_Disconnected') {
            deviceList.addAuthPenalty(device);
        }

        if (method) {
            // corner case:
            // thrown while acquiring device
            // it's a race condition between two tabs
            // workaround is to enumerate transport again and report changes to get a valid session number
            if (
                deviceList.isConnected() &&
                error.message === TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS
            ) {
                await deviceList.enumerate();
            }
            messageResponse = createResponseMessage(method.responseID, false, { error });
        }
    } finally {
        // Work done

        if (
            method.keepSession &&
            method.deviceState &&
            method.deviceState.sessionId !== device.getState()?.sessionId
        ) {
            // if session was changed from the one that was sent, send a device changed event
            sendCoreMessage(createDeviceMessage(DEVICE.CHANGED, device.toMessageObject()));
        }

        // TODO: This requires a massive refactoring https://github.com/trezor/trezor-suite/issues/5323
        // @ts-expect-error TODO: messageResponse should be assigned from the response of "inner" function
        const response = messageResponse;

        if (response) {
            // remove all listeners
            device.eventNames().forEach(e => device.removeAllListeners(e as keyof DeviceEvents));

            closePopup(context);
            cleanup(context);

            if (method) {
                method.dispose();
            }

            if (response.success) {
                deviceList.removeAuthPenalty(device);
            }

            sendCoreMessage(response);
        }
    }
};

/**
 * Clean up all variables and references.
 * @returns {void}
 * @memberof Core
 */
const cleanup = ({ uiPromises }: CoreContext) => {
    uiPromises.clear();
    _log.debug('Cleanup...');
};

/**
 * Force close popup.
 * @returns {void}
 * @memberof Core
 */
const closePopup = ({ sendCoreMessage }: CoreContext) => {
    sendCoreMessage(createUiMessage(UI_REQUEST.CLOSE_UI_WINDOW));
};

/**
 * Handle button request from Device.
 * @param {Device} device
 * @param {string} protobuf.ButtonRequest
 * @returns {Promise<void>}
 * @memberof Core
 */
const onDeviceButtonHandler =
    (device: Device, context: CoreContext, method?: AbstractMethod<any>) =>
    ({ payload: request }: DeviceEvents['button']) => {
        const { sendCoreMessage } = context;
        const addressRequest = request.code === 'ButtonRequest_Address';
        const data =
            typeof method?.getButtonRequestData === 'function' && request.code
                ? method?.getButtonRequestData(request.code, request.name)
                : undefined;
        // request view
        sendCoreMessage(
            createDeviceMessage(DEVICE.BUTTON, { ...request, device: device.toMessageObject() }),
        );
        sendCoreMessage(
            createUiMessage(UI_REQUEST.REQUEST_BUTTON, {
                ...request,
                device: device.toMessageObject(),
                data,
            }),
        );
        if (addressRequest && !method?.useUi) {
            sendCoreMessage(createUiMessage(UI_REQUEST.ADDRESS_VALIDATION, data));
        }
    };

const onDevicePinHandler =
    (device: Device, context: CoreContext) =>
    async ({ type, callback }: DeviceEvents['pin']) => {
        const { uiPromises, sendCoreMessage } = context;
        // create ui promise
        const uiPromise = uiPromises.create(UI_RESPONSE.RECEIVE_PIN, device);
        // request pin view
        sendCoreMessage(
            createUiMessage(
                UI_REQUEST.REQUEST_PIN,
                { device: device.toMessageObject(), type },
                uiPromise.requestId,
            ),
        );
        // wait for pin
        try {
            const uiResp = await uiPromise.promise;
            if (uiResp.payload == null) {
                callback({
                    success: false,
                    error: new Error(`${UI_RESPONSE.RECEIVE_PIN} missing payload`),
                });
            } else {
                callback({ success: true, payload: uiResp.payload });
            }
        } catch (error) {
            callback({ success: false, error });
        }
    };

const onDeviceWordHandler =
    (device: Device, context: CoreContext) =>
    async ({ type, callback }: DeviceEvents['word']) => {
        const { uiPromises, sendCoreMessage } = context;
        // create ui promise
        const uiPromise = uiPromises.create(UI_RESPONSE.RECEIVE_WORD, device);
        sendCoreMessage(
            createUiMessage(
                UI_REQUEST.REQUEST_WORD,
                { device: device.toMessageObject(), type },
                uiPromise.requestId,
            ),
        );
        // wait for word
        try {
            const uiResp = await uiPromise.promise;
            if (uiResp.payload == null) {
                callback({
                    success: false,
                    error: new Error(`${UI_RESPONSE.RECEIVE_WORD} missing payload`),
                });
            } else {
                callback({ success: true, payload: uiResp.payload });
            }
        } catch (error) {
            callback({ success: false, error });
        }
    };

const onDevicePassphraseHandler =
    (device: Device, context: CoreContext) =>
    async ({ callback }: DeviceEvents['passphrase']) => {
        const { uiPromises, sendCoreMessage } = context;
        // create ui promise
        const uiPromise = uiPromises.create(UI_RESPONSE.RECEIVE_PASSPHRASE, device);
        // request passphrase view
        sendCoreMessage(
            createUiMessage(
                UI_REQUEST.REQUEST_PASSPHRASE,
                { device: device.toMessageObject() },
                uiPromise.requestId,
            ),
        );
        // wait for passphrase
        try {
            const uiResp = await uiPromise.promise;
            if (uiResp.payload == null) {
                callback({
                    success: false,
                    error: new Error(`${UI_RESPONSE.RECEIVE_PASSPHRASE} missing payload`),
                });
            } else {
                callback({ success: true, payload: uiResp.payload });
            }
        } catch (error) {
            callback({ success: false, error });
        }
    };

/**
 * Handle passphrase request from Device and use empty
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */
const onEmptyPassphraseHandler =
    () =>
    ({ callback }: DeviceEvents['passphrase']) => {
        callback({ success: true, payload: { value: '' } });
    };

const onThpPairingHandler =
    (device: Device, context: CoreContext) =>
    async ({ callback, payload }: DeviceEvents['thp_pairing']) => {
        const { uiPromises, sendCoreMessage } = context;
        // create ui promise
        const uiPromise = uiPromises.create(UI_RESPONSE.RECEIVE_THP_PAIRING_TAG, device);

        sendCoreMessage(
            createUiMessage(
                UI_REQUEST.REQUEST_THP_PAIRING,
                {
                    device: device.toMessageObject(),
                    ...payload,
                },
                uiPromise.requestId,
            ),
        );
        // wait for response
        try {
            const uiResp = await uiPromise.promise;
            if (uiResp.payload == null) {
                callback({
                    success: false,
                    error: new Error(`${UI_RESPONSE.RECEIVE_THP_PAIRING_TAG} missing payload`),
                });
            } else {
                callback({ success: true, payload: uiResp.payload });
            }
        } catch (error) {
            callback({ success: false, error });
        }
    };

const onThpCredentialsChangedHandler =
    (device: Device, context: CoreContext) =>
    (payload: DeviceEvents['device-thp_credentials_changed']) => {
        const { sendCoreMessage } = context;

        sendCoreMessage(
            createDeviceMessage(DEVICE.THP_CREDENTIALS_CHANGED, {
                device: device.toMessageObject(),
                ...payload,
            }),
        );
    };

const onThpPhaseChangedHandler =
    (device: Device, context: CoreContext) =>
    (payload: DeviceEvents['device-thp_pairing_status_changed']) => {
        const { sendCoreMessage } = context;

        sendCoreMessage(
            createDeviceMessage(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                device: device.toMessageObject(),
                ...payload,
            }),
        );
    };

const registerDeviceEvents =
    (context: CoreContext, method?: AbstractMethod<any>) => (device: Device) => {
        device.removeAllListeners();
        device.on(DEVICE.BUTTON, onDeviceButtonHandler(device, context, method));
        device.on(DEVICE.PIN, onDevicePinHandler(device, context));
        device.on(DEVICE.WORD, onDeviceWordHandler(device, context));
        device.on(
            DEVICE.PASSPHRASE,
            (method?.useEmptyPassphrase ? onEmptyPassphraseHandler : onDevicePassphraseHandler)(
                device,
                context,
            ),
        );
        device.on(DEVICE.PASSPHRASE_ON_DEVICE, () => {
            context.sendCoreMessage(
                createUiMessage(UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE, {
                    device: device.toMessageObject(),
                }),
            );
        });
        device.on(DEVICE.FIRMWARE_VERSION_CHANGED, payload => {
            context.sendCoreMessage(createDeviceMessage(DEVICE.FIRMWARE_VERSION_CHANGED, payload));
        });
        device.on(DEVICE.THP_PAIRING, onThpPairingHandler(device, context));
        device.on(DEVICE.THP_CREDENTIALS_CHANGED, onThpCredentialsChangedHandler(device, context));
        device.on(DEVICE.THP_PAIRING_STATUS_CHANGED, onThpPhaseChangedHandler(device, context));
    };

/**
 * Handle popup closed by user.
 * @returns {void}
 * @memberof Core
 */
const onPopupClosed = (context: CoreContext, customErrorMessage?: string) => {
    const { uiPromises, deviceList, callMethods, resetWaitForFirstMethod, sendCoreMessage } =
        context;
    const error = customErrorMessage
        ? ERRORS.TypedError('Method_Cancel', customErrorMessage)
        : ERRORS.TypedError('Method_Interrupted');
    // Device was already acquired. Try to interrupt running action which will throw error from onCall try/catch block
    if (deviceList.isConnected() && deviceList.getDeviceCount() > 0) {
        deviceList.getAllDevices().forEach(d => {
            if (d.isUsedHere()) {
                d.interrupt(error);
            } else {
                const success = uiPromises.resolve({ type: DEVICE.DISCONNECT, payload: undefined });
                if (!success) {
                    callMethods.forEach(m => {
                        sendCoreMessage(createResponseMessage(m.responseID, false, { error }));
                    });
                    callMethods.splice(0, callMethods.length);
                    resetWaitForFirstMethod();
                }
            }
        });
        // Waiting for device. Throw error before onCall try/catch block
    } else {
        uiPromises.rejectAll(error);
    }
    cleanup(context);
};

const initDeviceList = (context: CoreContext) => {
    const { deviceList, sendCoreMessage } = context;

    deviceList.on(DEVICE.CONNECT, device => {
        sendCoreMessage(createDeviceMessage(DEVICE.CONNECT, device.toMessageObject()));
    });

    deviceList.on(DEVICE.CONNECT_UNACQUIRED, device => {
        sendCoreMessage(createDeviceMessage(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject()));
    });

    deviceList.on(DEVICE.DISCONNECT, device => {
        sendCoreMessage(createDeviceMessage(DEVICE.DISCONNECT, device.toMessageObject()));
    });

    deviceList.on(DEVICE.CHANGED, device => {
        sendCoreMessage(createDeviceMessage(DEVICE.CHANGED, device.toMessageObject()));
    });

    deviceList.on(DEVICE.TREZOR_PUSH_NOTIFICATION, payload => {
        sendCoreMessage(
            createDeviceMessage(DEVICE.TREZOR_PUSH_NOTIFICATION, {
                device: payload.device.toMessageObject(),
                mode: payload.mode,
                type: payload.type,
            }),
        );
    });

    deviceList.on(TRANSPORT.START, transport =>
        sendCoreMessage(createTransportMessage(TRANSPORT.START, transport)),
    );

    deviceList.on(TRANSPORT.ERROR, error => {
        _log.warn('TRANSPORT.ERROR', error.error);
        sendCoreMessage(createTransportMessage(TRANSPORT.ERROR, error));
    });
};

/**
 * An event emitter for communication with parent
 * @extends EventEmitter
 * @memberof Core
 */
export class Core extends EventEmitter {
    private abortController = new AbortController();
    private callMethods: AbstractMethod<any>[] = []; // generic type is irrelevant. only common functions are called at this level
    private methodSynchronize = getSynchronize();
    private uiPromises = createUiPromiseManager();

    private waitForFirstMethod = createDeferred();

    private _deviceList?: IDeviceList;
    private get deviceList() {
        return this._deviceList ?? throwError('Core not initialized: deviceList');
    }

    private sendCoreMessage(message: CoreEventMessage) {
        if (message.event === RESPONSE_EVENT) {
            const index = this.callMethods.findIndex(
                call => call && call.responseID === message.id,
            );
            if (index >= 0) {
                this.callMethods.splice(index, 1);
                if (this.callMethods.length === 0) {
                    this.waitForFirstMethod = createDeferred();
                }
            }
        }
        this.emit(CORE_EVENT, message);
    }

    private getCoreContext() {
        return {
            signal: this.abortController.signal,
            uiPromises: this.uiPromises,
            deviceList: this.deviceList,
            callMethods: this.callMethods,
            methodSynchronize: this.methodSynchronize,
            sendCoreMessage: this.sendCoreMessage.bind(this),
            resetWaitForFirstMethod: () => {
                this.waitForFirstMethod = createDeferred();
            },
            resolveWaitForFirstMethod: () => {
                this.waitForFirstMethod.resolve();
            },
        };
    }

    handleMessage(message: CoreRequestMessage) {
        _log.debug('handleMessage', message.type);

        switch (message.type) {
            case POPUP.CLOSED:
                onPopupClosed(
                    this.getCoreContext(),
                    message.payload ? message.payload.error : null,
                );
                break;

            case TRANSPORT.DISABLE_WEBUSB: {
                const settings = settingsStore.get();
                const transports = settings.transports?.filter(t => t !== 'WebUsbTransport');
                if (transports && !transports.includes('BridgeTransport')) {
                    transports.unshift('BridgeTransport');
                }
                settings.transports = transports;

                resetTransports(this.getCoreContext());
                break;
            }
            case TRANSPORT.SET_TRANSPORTS:
                settingsStore.update({ transports: message.payload.transports });
                resetTransports(this.getCoreContext());
                break;

            case TRANSPORT.REQUEST_DEVICE:
                /**
                 * after pairing with device is requested in native context, for example see
                 * requestWebUSBDevice in connect-web/src/index, this is used to trigger transport
                 * enumeration
                 */
                if (this.deviceList.isConnected()) {
                    this.deviceList.enumerate();
                }
                break;

            case TRANSPORT.GET_INFO:
                this.sendCoreMessage(
                    createResponseMessage(message.id, true, this.getActiveTransports()),
                );
                break;

            // messages from UI (popup/modal...)
            case UI_RESPONSE.RECEIVE_CONFIRMATION:
            case UI_RESPONSE.RECEIVE_PIN:
            case UI_RESPONSE.RECEIVE_PASSPHRASE:
            case UI_RESPONSE.RECEIVE_THP_PAIRING_TAG:
            case UI_RESPONSE.RECEIVE_ACCOUNT:
            case UI_RESPONSE.RECEIVE_FEE:
            case UI_RESPONSE.RECEIVE_WORD:
            case UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNTS:
                this.uiPromises.resolve(message);
                break;
            case UI_RESPONSE.RECEIVE_FIRMWARE: {
                const localFirmwares = message.payload && parseLocalFirmwares(message.payload);
                if (localFirmwares) {
                    localFirmwareStore.set(localFirmwares);
                }
                break;
            }

            // message from index
            case CORE_CALL:
                // firmwareUpdate is the only procedure that expects device disconnecting
                // and reconnecting during the process. Due to this it can't be handled just
                // like regular methods using onCall function. In onCall, disconnecting device
                // means that call immediately returns error.
                if (message.payload.method === 'firmwareUpdate') {
                    assertDeviceListConnected(this.deviceList);

                    const coreContext = this.getCoreContext();
                    onCallFirmwareUpdate({
                        params: message.payload,
                        context: {
                            deviceList: this.deviceList,
                            postMessage: this.sendCoreMessage.bind(this),
                            selectDevice: path => selectDevice(coreContext, { path }),
                            log: _log,
                            abortSignal: this.abortController.signal,
                            registerEvents: registerDeviceEvents(coreContext),
                            uiPromises: coreContext.uiPromises,
                        },
                    })
                        .then(payload => {
                            this.sendCoreMessage(createResponseMessage(message.id, true, payload));
                        })
                        .catch(error => {
                            this.sendCoreMessage(
                                createResponseMessage(message.id, false, { error }),
                            );
                            _log.error('onCallFirmwareUpdate', error);
                        });
                } else {
                    onCall(this.getCoreContext(), message).catch(error => {
                        _log.error('onCall', error);
                    });
                }
        }
    }

    dispose() {
        disposeBackend();
        this.removeAllListeners();
        this.abortController.abort();
        this.deviceList.dispose();
    }

    async getCurrentMethod() {
        await this.waitForFirstMethod.promise;

        return await this.methodSynchronize(() => this.callMethods[0]);
    }

    getActiveTransports(): TransportInfo[] | undefined {
        if (this.deviceList.isConnected()) {
            return this.deviceList.getActiveTransports();
        }
    }

    enumerate() {
        if (this.deviceList.isConnected()) {
            this.deviceList.enumerate();
        }
    }

    async init(
        settings: ConnectSettings,
        onCoreEvent: (message: CoreEventMessage) => void,
        logWriterFactory?: () => LogWriter | undefined,
    ) {
        if (logWriterFactory) {
            setLogWriter(logWriterFactory);
        }

        // do not send any event until Core is fully loaded
        // DeviceList emits TRANSPORT and DEVICE events if pendingTransportEvent is set
        const throttlePromise = createDeferred();
        throttlePromise.promise.catch(() => {});
        const onCoreEventThrottled = (message: CoreEventMessage) =>
            throttlePromise.promise.then(() => onCoreEvent(message));

        try {
            settingsStore.set(settings);
            await firmwareReleaseStore.init(
                settings.firmwareChannel,
                false,
                initializeFirmwareConfig,
            );
            const localFirmwares =
                settings.localFirmwares && parseLocalFirmwares(settings.localFirmwares);
            if (localFirmwares) {
                localFirmwareStore.set(localFirmwares);
            }
            await loadProtobufModules();
            const { debug, priority, manifest } = settingsStore.get();

            enableLog(debug);

            this._deviceList = new DeviceList({
                debug,
                priority,
                manifest,
            });
            initDeviceList(this.getCoreContext());

            this.on(CORE_EVENT, onCoreEventThrottled);
        } catch (error) {
            // TODO: kill app
            _log.error('init', error);
            throttlePromise.reject(error);
            throw error;
        }

        const { transports, pendingTransportEvent, transportReconnect, coreMode } =
            settingsStore.get();

        try {
            this.deviceList.init({ transports, pendingTransportEvent, transportReconnect });
        } catch (error) {
            this.sendCoreMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
            throttlePromise.reject(error);
            throw error;
        }

        // in auto core mode, we have to wait to check if transport is available
        if (!transportReconnect || coreMode === 'auto') {
            await this.deviceList.pendingConnection();
        }

        // Core initialized successfully, disable throttle
        this.on(CORE_EVENT, onCoreEvent);
        this.off(CORE_EVENT, onCoreEventThrottled);
        setTimeout(throttlePromise.resolve, 0);
    }
}

const resetTransports = async ({ deviceList, sendCoreMessage }: CoreContext) => {
    const { transports, pendingTransportEvent, transportReconnect } = settingsStore.get();

    try {
        await deviceList.init({ transports, pendingTransportEvent, transportReconnect });
    } catch (error) {
        // do nothing
        sendCoreMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
    }
};

const initCore = async (...params: Parameters<Core['init']>) => {
    const core = new Core();
    await core.init(...params);

    return core;
};

const disposeCore = (core: Core) => {
    core.dispose();
};

/** State initialization */
export const initCoreState = () => createLazy(initCore, disposeCore);
