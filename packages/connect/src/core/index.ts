/* eslint-disable @typescript-eslint/no-use-before-define */
import EventEmitter from 'events';
import { DataManager } from '../data/DataManager';
import { DeviceList } from '../device/DeviceList';
import { enhancePostMessageWithAnalytics } from '../data/analyticsInfo';

import { ERRORS } from '../constants';

import {
    CORE_EVENT,
    RESPONSE_EVENT,
    UI,
    POPUP,
    IFRAME,
    TRANSPORT,
    DEVICE,
    createUiMessage,
    createPopupMessage,
    createDeviceMessage,
    createTransportMessage,
    createResponseMessage,
    TransportInfo,
    CoreMessage,
    UiPromise,
    UiPromiseResponse,
} from '../events';
import { getMethod } from './method';

import { create as createDeferred, Deferred } from '../utils/deferred';
import { resolveAfter } from '../utils/promiseUtils';
import { initLog, enableLog } from '../utils/debug';
import { dispose as disposeBackend } from '../backend/BlockchainLink';
import { InteractionTimeout } from '../utils/interactionTimeout';

import type { DeviceEvents, Device } from '../device/Device';
import type { ConnectSettings, CommonParams, Device as DeviceTyped } from '../types';

type AbstractMethod = ReturnType<typeof getMethod>;

// Public variables
let _core: Core; // Class with event emitter
let _deviceList: DeviceList | undefined; // Instance of DeviceList
let _popupPromise: Deferred<void> | undefined; // Waiting for popup handshake
let _uiPromises: UiPromise<UiPromiseResponse['type']>[] = []; // Waiting for ui response
const _callMethods: AbstractMethod[] = []; // generic type is irrelevant. only common functions are called at this level
let _preferredDevice: CommonParams['device'];
let _interactionTimeout: InteractionTimeout;

// custom log
const _log = initLog('Core');

/**
 * Emit message to listener (parent).
 * Clear method reference from _callMethods
 * @param {CoreMessage} message
 * @returns {void}
 * @memberof Core
 */
const postMessage = (message: CoreMessage) => {
    if (message.event === RESPONSE_EVENT) {
        const index = _callMethods.findIndex(call => call && call.responseID === message.id);
        if (index >= 0) {
            _callMethods.splice(index, 1);
        }
    }
    _core.emit(CORE_EVENT, message);
};

/**
 * Creates an instance of _popupPromise.
 * If Core is used without popup this promise should be always resolved automatically
 * @param {boolean} requestWindow
 * @returns {Deferred<void>}
 * @memberof Core
 */
const getPopupPromise = (requestWindow = true) => {
    // request ui window (used with modal)
    if (requestWindow) {
        postMessage(createUiMessage(UI.REQUEST_UI_WINDOW));
    }
    if (!_popupPromise) {
        _popupPromise = createDeferred();
    }
    return _popupPromise;
};

/**
 * Start interaction timeout timer
 */
const interactionTimeout = () =>
    _interactionTimeout.start(() => {
        onPopupClosed('Interaction timeout');
    });

/**
 * Creates an instance of uiPromise.
 * @param {string} promiseEvent
 * @param {Device} device
 * @returns {Deferred<UiPromise>}
 * @memberof Core
 */
const createUiPromise = <T extends UiPromiseResponse['type']>(promiseEvent: T, device?: Device) => {
    const uiPromise: UiPromise<T> = createDeferred(promiseEvent, device);
    _uiPromises.push(uiPromise as any);

    // Interaction timeout
    interactionTimeout();

    return uiPromise;
};

/**
 * Finds an instance of uiPromise.
 * @param {string} promiseEvent
 * @returns {Deferred<UiPromise> | void}
 * @memberof Core
 */
const findUiPromise = <T extends UiPromiseResponse['type']>(promiseEvent: T) =>
    _uiPromises.find(p => p.id === promiseEvent) as UiPromise<T> | undefined;

const removeUiPromise = (promise: Deferred<any>) => {
    _uiPromises = _uiPromises.filter(p => p !== promise);
};

/**
 * Handle incoming message.
 * @param {CoreMessage} message
 * @param {boolean} isTrustedOrigin
 * @returns {void}
 * @memberof Core
 */
export const handleMessage = (message: CoreMessage, isTrustedOrigin = false) => {
    _log.debug('handleMessage', isTrustedOrigin, message);

    const safeMessages: CoreMessage['type'][] = [
        IFRAME.CALL,
        POPUP.CLOSED,
        // UI.CHANGE_SETTINGS,
        UI.LOGIN_CHALLENGE_RESPONSE,
        TRANSPORT.DISABLE_WEBUSB,
    ];

    if (!isTrustedOrigin && safeMessages.indexOf(message.type) === -1) {
        return;
    }

    switch (message.type) {
        case POPUP.HANDSHAKE:
            getPopupPromise(false).resolve();
            break;
        case POPUP.CLOSED:
            onPopupClosed(message.payload ? message.payload.error : null);
            break;

        // case UI.CHANGE_SETTINGS :
        //     enableLog(parseSettings(message.payload).debug);
        //     break;

        case TRANSPORT.DISABLE_WEBUSB:
            disableWebUSBTransport();
            break;

        case TRANSPORT.REQUEST_DEVICE:
            /**
             * after pairing with device is requested in native context, for example see
             * requestWebUSBDevice in connect-web/src/index, this is used to trigger transport
             * enumeration
             */
            _deviceList?.enumerate();
            break;

        // messages from UI (popup/modal...)
        case UI.RECEIVE_DEVICE:
        case UI.RECEIVE_CONFIRMATION:
        case UI.RECEIVE_PERMISSION:
        case UI.RECEIVE_PIN:
        case UI.RECEIVE_PASSPHRASE:
        case UI.INVALID_PASSPHRASE_ACTION:
        case UI.RECEIVE_ACCOUNT:
        case UI.RECEIVE_FEE:
        case UI.RECEIVE_WORD:
        case UI.LOGIN_CHALLENGE_RESPONSE: {
            const uiPromise = findUiPromise(message.type);
            if (uiPromise) {
                uiPromise.resolve(message);
                removeUiPromise(uiPromise);
            }
            break;
        }

        // message from index
        case IFRAME.CALL:
            onCall(message).catch(error => {
                _log.error('onCall', error);
            });
            break;

        // no default
    }
};

/**
 * Find device by device path. Returned device may be unacquired.
 * @param {AbstractMethod} method
 * @returns {Promise<Device>}
 * @memberof Core
 */
const initDevice = async (method: AbstractMethod) => {
    if (!_deviceList) {
        throw ERRORS.TypedError('Transport_Missing');
    }

    const isWebUsb = _deviceList.transportType() === 'WebUsbTransport';
    let device: Device | typeof undefined;
    let showDeviceSelection = isWebUsb;
    if (method.devicePath) {
        device = _deviceList.getDevice(method.devicePath);
        showDeviceSelection = !!device?.unreadableError;
    } else {
        const devices = _deviceList.asArray();
        if (devices.length === 1 && !isWebUsb) {
            // there is only one device available. use it
            device = _deviceList.getDevice(devices[0].path);
            showDeviceSelection = !!device?.unreadableError;
        } else {
            showDeviceSelection = true;
        }
    }

    // show device selection when:
    // - there are no devices
    // - using webusb and method.devicePath is not set
    // - device is in unreadable state
    if (showDeviceSelection) {
        // initialize uiPromise instance which will catch changes in _deviceList (see: handleDeviceSelectionChanges function)
        // but do not wait for resolve yet
        createUiPromise(UI.RECEIVE_DEVICE);

        // wait for popup handshake
        await getPopupPromise().promise;

        // check again for available devices
        // there is a possible race condition before popup open
        const devices = _deviceList.asArray();
        if (devices.length === 1 && devices[0].type !== 'unreadable' && !isWebUsb) {
            // there is one device available. use it
            device = _deviceList.getDevice(devices[0].path);
        } else {
            // request select device view
            postMessage(
                createUiMessage(UI.SELECT_DEVICE, {
                    webusb: isWebUsb,
                    devices: _deviceList.asArray(),
                }),
            );

            // wait for device selection
            const uiPromise = findUiPromise(UI.RECEIVE_DEVICE);
            if (uiPromise) {
                const { payload } = await uiPromise.promise;
                if (payload.remember) {
                    _preferredDevice = payload.device;
                }
                device = _deviceList.getDevice(payload.device.path);
            }
        }
    }

    if (!device) {
        throw ERRORS.TypedError('Device_NotFound');
    }
    return device;
};

/**
 * Processing incoming message.
 * This method is async that's why it returns Promise but the real response is passed by postMessage(ResponseMessage)
 * @param {CoreMessage} message
 * @returns {Promise<void>}
 * @memberof Core
 */
export const onCall = async (message: CoreMessage) => {
    if (!message.id || !message.payload || message.type !== IFRAME.CALL) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'onCall: message.id or message.payload is missing',
        );
    }

    const responseID = message.id;
    const trustedHost = DataManager.getSettings('trustedHost');
    const isUsingPopup = DataManager.getSettings('popup');

    if (_preferredDevice && !message.payload.device) {
        message.payload.device = _preferredDevice;
    }

    // find method and parse incoming params
    let method: AbstractMethod;
    let messageResponse: CoreMessage;
    try {
        method = getMethod(message);
        // bind callbacks
        method.postMessage = postMessage;
        method.getPopupPromise = getPopupPromise;
        method.createUiPromise = createUiPromise;
        // start validation process
        method.init();
    } catch (error) {
        postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
        postMessage(createResponseMessage(responseID, false, { error }));
        return Promise.resolve();
    }

    _callMethods.push(method);

    // this method is not using the device, there is no need to acquire
    if (!method.useDevice) {
        try {
            if (method.useUi) {
                // wait for popup handshake
                await getPopupPromise().promise;
            } else {
                // cancel popup request
                postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
            }
            const response = await method.run();
            messageResponse = createResponseMessage(method.responseID, true, response);
        } catch (error) {
            messageResponse = createResponseMessage(method.responseID, false, { error });
        }
        postMessage(messageResponse);
        return Promise.resolve();
    }

    if (!_deviceList && !DataManager.getSettings('transportReconnect')) {
        // transport is missing try to initialize it once again
        await initTransport(DataManager.getSettings());
    }

    if (
        isUsingPopup &&
        method.requiredPermissions.includes('management') &&
        !DataManager.isManagementAllowed()
    ) {
        postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
        postMessage(
            createResponseMessage(responseID, false, {
                error: ERRORS.TypedError('Method_NotAllowed'),
            }),
        );
        return Promise.resolve();
    }

    // find device
    let device: Device;
    try {
        device = await initDevice(method);
    } catch (error) {
        if (error.code === 'Transport_Missing') {
            // wait for popup handshake
            await getPopupPromise().promise;
            // show message about transport
            postMessage(createUiMessage(UI.TRANSPORT));
        } else {
            // cancel popup request
            postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
        }
        // TODO: this should not be returned here before user agrees on "read" perms...
        postMessage(createResponseMessage(responseID, false, { error }));
        throw error;
    }

    method.postMessage = (message: CoreMessage) =>
        enhancePostMessageWithAnalytics(postMessage, message, { device: device.toMessageObject() });

    method.setDevice(device);

    // find pending calls to this device
    const previousCall = _callMethods.filter(
        call => call && call !== method && call.devicePath === method.devicePath,
    );
    if (previousCall.length > 0 && method.overridePreviousCall) {
        // set flag for each pending method
        previousCall.forEach(call => {
            call.overridden = true;
        });
        // interrupt potential communication with device. this should throw error in try/catch block below
        // this error will apply to the last item of pending methods
        const overrideError = ERRORS.TypedError('Method_Override');
        await device.override(overrideError);
        // if current method was overridden while waiting for device.override result
        // return response with status false
        if (method.overridden) {
            postMessage(createResponseMessage(method.responseID, false, { error: overrideError }));
            throw overrideError;
        }
    } else if (device.isRunning()) {
        if (!device.isLoaded()) {
            // corner case
            // device didn't finish loading for the first time. @see DeviceList._createAndSaveDevice
            // wait for self-release and then carry on
            await device.waitForFirstRun();
        } else {
            // cancel popup request
            // postMessage(UiMessage(POPUP.CANCEL_POPUP_REQUEST));
            postMessage(
                createResponseMessage(responseID, false, {
                    error: ERRORS.TypedError('Device_CallInProgress'),
                }),
            );
            throw ERRORS.TypedError('Device_CallInProgress');
        }
    }

    // set device instance. default is 0
    device.setInstance(message.payload.device?.instance);

    if (method.hasExpectedDeviceState) {
        device.setExternalState(method.deviceState);
    }

    // device is available
    // set public variables, listeners and run method
    device.on(DEVICE.BUTTON, (d, code) => {
        onDeviceButtonHandler(d, code, method);
    });
    device.on(DEVICE.PIN, onDevicePinHandler);
    device.on(DEVICE.WORD, onDeviceWordHandler);
    device.on(
        DEVICE.PASSPHRASE,
        method.useEmptyPassphrase ? onEmptyPassphraseHandler : onDevicePassphraseHandler,
    );
    device.on(DEVICE.PASSPHRASE_ON_DEVICE, () => {
        postMessage(
            createUiMessage(UI.REQUEST_PASSPHRASE_ON_DEVICE, { device: device.toMessageObject() }),
        );
    });

    try {
        let PIN_TRIES = 1;
        const MAX_PIN_TRIES = 3;
        // This function will run inside Device.run() after device will be acquired and initialized
        const inner = async (): Promise<any> => {
            const firmwareException = await method.checkFirmwareRange(isUsingPopup!);
            if (firmwareException) {
                if (isUsingPopup) {
                    await getPopupPromise().promise;
                    // show unexpected state information
                    postMessage(createUiMessage(firmwareException, device.toMessageObject()));

                    // wait for device disconnect
                    await createUiPromise(DEVICE.DISCONNECT, device).promise;
                    // interrupt process and go to "final" block
                    return Promise.reject(ERRORS.TypedError('Method_Cancel'));
                }
                // return error if not using popup
                return Promise.reject(ERRORS.TypedError('Device_FwException', firmwareException));
            }

            // check if device is in unexpected mode [bootloader, not-initialized, required firmware]
            const unexpectedMode = device.hasUnexpectedMode(
                method.allowDeviceMode,
                method.requireDeviceMode,
            );
            if (unexpectedMode) {
                device.keepSession = false;
                if (isUsingPopup) {
                    // wait for popup handshake
                    await getPopupPromise().promise;
                    // show unexpected state information
                    postMessage(createUiMessage(unexpectedMode, device.toMessageObject()));

                    // wait for device disconnect
                    await createUiPromise(DEVICE.DISCONNECT, device).promise;
                    // interrupt process and go to "final" block
                    return Promise.reject(
                        ERRORS.TypedError('Device_ModeException', unexpectedMode),
                    );
                }
                // throw error if not using popup
                return Promise.reject(ERRORS.TypedError('Device_ModeException', unexpectedMode));
            }

            // check and request permissions [read, write...]
            method.checkPermissions();
            if (!trustedHost && method.requiredPermissions.length > 0) {
                // show permissions in UI
                const permitted = await method.requestPermissions();
                if (!permitted) {
                    // interrupt process and go to "final" block
                    return Promise.reject(ERRORS.TypedError('Method_PermissionsNotGranted'));
                }
            }

            const deviceNeedsBackup = device.features.needs_backup;
            if (deviceNeedsBackup && typeof method.noBackupConfirmation === 'function') {
                const permitted = await method.noBackupConfirmation();
                if (!permitted) {
                    // interrupt process and go to "final" block
                    return Promise.reject(ERRORS.TypedError('Method_PermissionsNotGranted'));
                }
            }

            if (deviceNeedsBackup) {
                // wait for popup handshake
                await getPopupPromise().promise;
                // show notification
                postMessage(createUiMessage(UI.DEVICE_NEEDS_BACKUP, device.toMessageObject()));
            }

            // notify if firmware is outdated but not required
            if (device.firmwareStatus === 'outdated') {
                // wait for popup handshake
                await getPopupPromise().promise;
                // show notification
                postMessage(createUiMessage(UI.FIRMWARE_OUTDATED, device.toMessageObject()));
            }

            // ask for confirmation [export xpub, export info, sign message]
            if (!trustedHost && typeof method.confirmation === 'function') {
                // show confirmation in UI
                const confirmed = await method.confirmation();
                if (!confirmed) {
                    // interrupt process and go to "final" block
                    return Promise.reject(ERRORS.TypedError('Method_Cancel'));
                }
            }

            // Make sure that device will display pin/passphrase
            try {
                const invalidDeviceState = method.useDeviceState
                    ? await device.validateState(method.network, method.preauthorized)
                    : undefined;
                if (invalidDeviceState) {
                    if (isUsingPopup) {
                        // initialize user response promise
                        const uiPromise = createUiPromise(UI.INVALID_PASSPHRASE_ACTION, device);
                        // request action view
                        postMessage(
                            createUiMessage(UI.INVALID_PASSPHRASE, {
                                device: device.toMessageObject(),
                            }),
                        );
                        // wait for user response
                        const uiResp = await uiPromise.promise;
                        if (uiResp.payload) {
                            // reset internal device state and try again
                            device.setInternalState(undefined);
                            await device.initialize(
                                method.useEmptyPassphrase,
                                method.useCardanoDerivation,
                            );
                            return inner();
                        }
                        // set new state as requested
                        device.setExternalState(invalidDeviceState);
                    } else {
                        throw ERRORS.TypedError('Device_InvalidState');
                    }
                }
            } catch (error) {
                // catch wrong pin error
                if (
                    error.message === ERRORS.INVALID_PIN_ERROR_MESSAGE &&
                    PIN_TRIES < MAX_PIN_TRIES
                ) {
                    PIN_TRIES++;
                    postMessage(
                        createUiMessage(UI.INVALID_PIN, { device: device.toMessageObject() }),
                    );
                    return inner();
                }
                // other error
                // postMessage(ResponseMessage(method.responseID, false, { error }));
                // closePopup();
                // clear cached passphrase. it's not valid
                device.setInternalState(undefined);
                // interrupt process and go to "final" block
                return Promise.reject(error);
            }

            if (method.useUi) {
                // make sure that popup is opened
                await getPopupPromise().promise;
            } else {
                // popup is not required
                postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
            }

            // run method
            try {
                const response = await method.run();
                messageResponse = createResponseMessage(method.responseID, true, response);
            } catch (error) {
                return Promise.reject(error);
            }
        };

        // run inner function
        await device.run(inner, {
            keepSession: method.keepSession,
            useEmptyPassphrase: method.useEmptyPassphrase,
            skipFinalReload: method.skipFinalReload,
            useCardanoDerivation: method.useCardanoDerivation,
        });
    } catch (error) {
        // corner case: Device was disconnected during authorization
        // this device_id needs to be stored and penalized with delay on future connection
        // this solves issue with U2F login (leaves space for requests from services which aren't using trezord)
        if (_deviceList && error.code === 'Device_Disconnected') {
            _deviceList.addAuthPenalty(device);
        }

        if (method) {
            // corner case:
            // thrown while acquiring device
            // it's a race condition between two tabs
            // workaround is to enumerate transport again and report changes to get a valid session number
            if (_deviceList && error.message === ERRORS.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE) {
                _deviceList.enumerate();
            }
            messageResponse = createResponseMessage(method.responseID, false, { error });
        }
    } finally {
        // Work done

        // TODO: This requires a massive refactoring https://github.com/trezor/trezor-suite/issues/5323
        // @ts-expect-error TODO: messageResponse should be assigned from the response of "inner" function
        const response = messageResponse;

        if (response) {
            if (method.name === 'rebootToBootloader' && response.success) {
                // Wait for device to switch to bootloader
                // This delay is crucial see https://github.com/trezor/trezor-firmware/issues/1983
                await resolveAfter(1000);
                // call Device.run with empty function to fetch new Features
                // (acquire > Initialize > nothing > release)
                await device.run(() => Promise.resolve(), { skipFinalReload: true });
            }
            await device.cleanup();

            closePopup();
            cleanup();

            if (method) {
                method.dispose();
            }

            // restore default messages
            if (_deviceList) {
                if (response.success) {
                    _deviceList.removeAuthPenalty(device);
                }
            }
            postMessage(response);
        }
    }
};

/**
 * Clean up all variables and references.
 * @returns {void}
 * @memberof Core
 */
const cleanup = () => {
    // closePopup(); // this causes problem when action is interrupted (example: bootloader mode)
    _popupPromise = undefined;
    _uiPromises = []; // TODO: remove only promises with params callId
    _interactionTimeout.stop();
    _log.debug('Cleanup...');
};

/**
 * Force close popup.
 * @returns {void}
 * @memberof Core
 */
const closePopup = () => {
    if (_popupPromise) {
        postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
    }
    postMessage(createUiMessage(UI.CLOSE_UI_WINDOW));
};

/**
 * Handle button request from Device.
 * @param {Device} device
 * @param {string} protobuf.ButtonRequest
 * @returns {Promise<void>}
 * @memberof Core
 */
const onDeviceButtonHandler = async (
    ...[device, request, method]: [...DeviceEvents['button'], AbstractMethod]
) => {
    // wait for popup handshake
    const addressRequest = request.code === 'ButtonRequest_Address';
    if (!addressRequest || (addressRequest && method.useUi)) {
        await getPopupPromise().promise;
    }
    const data =
        typeof method.getButtonRequestData === 'function' && request.code
            ? method.getButtonRequestData(request.code)
            : undefined;
    // interaction timeout
    interactionTimeout();
    // request view
    postMessage(
        createDeviceMessage(DEVICE.BUTTON, { ...request, device: device.toMessageObject() }),
    );
    postMessage(
        createUiMessage(UI.REQUEST_BUTTON, {
            ...request,
            device: device.toMessageObject(),
            data,
        }),
    );
    if (addressRequest && !method.useUi) {
        postMessage(createUiMessage(UI.ADDRESS_VALIDATION, data));
    }
};

/**
 * Handle pin request from Device.
 * @param {Device} device
 * @param {string} protobuf.PinMatrixRequestType
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */
const onDevicePinHandler = async (...[device, type, callback]: DeviceEvents['pin']) => {
    // wait for popup handshake
    await getPopupPromise().promise;
    // create ui promise
    const uiPromise = createUiPromise(UI.RECEIVE_PIN, device);
    // request pin view
    postMessage(createUiMessage(UI.REQUEST_PIN, { device: device.toMessageObject(), type }));
    // wait for pin
    const uiResp = await uiPromise.promise;
    // callback.apply(null, [null, pin]);
    callback(null, uiResp.payload);
};

const onDeviceWordHandler = async (...[device, type, callback]: DeviceEvents['word']) => {
    // wait for popup handshake
    await getPopupPromise().promise;
    // create ui promise
    const uiPromise = createUiPromise(UI.RECEIVE_WORD, device);
    postMessage(createUiMessage(UI.REQUEST_WORD, { device: device.toMessageObject(), type }));
    // wait for word
    const uiResp = await uiPromise.promise;
    callback(null, uiResp.payload);
};

/**
 * Handle passphrase request from Device.
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */
const onDevicePassphraseHandler = async (...[device, callback]: DeviceEvents['passphrase']) => {
    // wait for popup handshake
    await getPopupPromise().promise;
    // create ui promise
    const uiPromise = createUiPromise(UI.RECEIVE_PASSPHRASE, device);
    // request passphrase view
    postMessage(createUiMessage(UI.REQUEST_PASSPHRASE, { device: device.toMessageObject() }));
    // wait for passphrase
    const uiResp = await uiPromise.promise;
    const { value, passphraseOnDevice, save } = uiResp.payload;
    // send as PassphrasePromptResponse
    callback({
        passphrase: value.normalize('NFKD'),
        passphraseOnDevice,
        cache: save,
    });
};

/**
 * Handle passphrase request from Device and use empty
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */
const onEmptyPassphraseHandler = (...[_, callback]: DeviceEvents['passphrase']) => {
    // send as PassphrasePromptResponse
    callback({ passphrase: '' });
};

/**
 * Handle popup closed by user.
 * @returns {void}
 * @memberof Core
 */
const onPopupClosed = (customErrorMessage?: string) => {
    const error = customErrorMessage
        ? ERRORS.TypedError('Method_Cancel', customErrorMessage)
        : ERRORS.TypedError('Method_Interrupted');
    // Device was already acquired. Try to interrupt running action which will throw error from onCall try/catch block
    if (_deviceList && _deviceList.asArray().length > 0) {
        _deviceList.allDevices().forEach(d => {
            d.keepSession = false; // clear session on release
            if (d.isUsedHere()) {
                d.interruptionFromUser(error);
            } else {
                const uiPromise = findUiPromise(DEVICE.DISCONNECT);
                if (uiPromise) {
                    uiPromise.resolve({ type: DEVICE.DISCONNECT, payload: undefined });
                } else {
                    _callMethods.forEach(m => {
                        postMessage(createResponseMessage(m.responseID, false, { error }));
                    });
                    _callMethods.splice(0, _callMethods.length);
                }
            }
        });
        cleanup();
        // Waiting for device. Throw error before onCall try/catch block
    } else {
        if (_uiPromises.length > 0) {
            _uiPromises.forEach(p => {
                p.reject(error);
            });
            _uiPromises = [];
        }
        if (_popupPromise) {
            _popupPromise.reject(error);
            _popupPromise = undefined;
        }
        cleanup();
    }
};

/**
 * Handle DeviceList changes.
 * If there is uiPromise waiting for device selection update view.
 * Used in initDevice function
 * @param {DeviceTyped} interruptDevice
 * @returns {void}
 * @memberof Core
 */
const handleDeviceSelectionChanges = (interruptDevice?: DeviceTyped) => {
    // update list of devices in popup
    const uiPromise = findUiPromise(UI.RECEIVE_DEVICE);
    if (uiPromise && _deviceList) {
        const list = _deviceList.asArray();
        const isWebUsb = _deviceList.transportType() === 'WebUsbTransport';

        if (list.length === 1 && !isWebUsb) {
            // there is only one device. use it
            // resolve uiPromise to looks like it's a user choice (see: handleMessage function)
            uiPromise.resolve({
                type: UI.RECEIVE_DEVICE,
                payload: { device: list[0] },
            });
            removeUiPromise(uiPromise);
        } else {
            // update device selection list view
            postMessage(
                createUiMessage(UI.SELECT_DEVICE, {
                    webusb: isWebUsb,
                    devices: list,
                }),
            );
        }
    }

    // device was disconnected, interrupt pending uiPromises for this device
    if (interruptDevice) {
        const { path } = interruptDevice;
        let shouldClosePopup = false;
        _uiPromises.forEach(p => {
            if (p.data && p.data.getDevicePath() === path) {
                if (p.id === DEVICE.DISCONNECT) {
                    p.resolve({ type: DEVICE.DISCONNECT });
                }
                shouldClosePopup = true;
            }
        });

        if (_preferredDevice && _preferredDevice.path === path) {
            _preferredDevice = undefined;
        }

        if (shouldClosePopup) {
            closePopup();
            cleanup();
        }
    }
};

/**
 * Start DeviceList with listeners.
 * @param {ConnectSettings} settings
 * @returns {Promise<void>}
 * @memberof Core
 */
const initDeviceList = async (settings: ConnectSettings) => {
    try {
        _deviceList = new DeviceList();

        _deviceList.on(DEVICE.CONNECT, device => {
            handleDeviceSelectionChanges();
            postMessage(createDeviceMessage(DEVICE.CONNECT, device));
        });

        _deviceList.on(DEVICE.CONNECT_UNACQUIRED, device => {
            handleDeviceSelectionChanges();
            postMessage(createDeviceMessage(DEVICE.CONNECT_UNACQUIRED, device));
        });

        _deviceList.on(DEVICE.DISCONNECT, device => {
            handleDeviceSelectionChanges(device);
            postMessage(createDeviceMessage(DEVICE.DISCONNECT, device));
        });

        _deviceList.on(DEVICE.CHANGED, device => {
            postMessage(createDeviceMessage(DEVICE.CHANGED, device));
        });

        _deviceList.on(TRANSPORT.ERROR, async error => {
            _log.warn('TRANSPORT.ERROR', error);
            if (_deviceList) {
                _deviceList.disconnectDevices();
                _deviceList.dispose();
            }

            _deviceList = undefined;

            postMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
            // if transport fails during app lifetime, try to reconnect
            if (settings.transportReconnect) {
                await resolveAfter(1000, null);
                await initDeviceList(settings);
            }
        });

        _deviceList.on(TRANSPORT.START, transportType =>
            postMessage(createTransportMessage(TRANSPORT.START, transportType)),
        );

        await _deviceList.init();
        if (_deviceList) {
            await _deviceList.waitForTransportFirstEvent();
        }
    } catch (error) {
        _deviceList = undefined;
        postMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
        if (!settings.transportReconnect) {
            throw error;
        } else {
            await resolveAfter(3000, null);
            // try to reconnect
            await initDeviceList(settings);
        }
    }
};

/**
 * An event emitter for communication with parent
 * @extends EventEmitter
 * @memberof Core
 */
export class Core extends EventEmitter {
    handleMessage(message: any, isTrustedOrigin: boolean) {
        handleMessage(message, isTrustedOrigin);
    }

    async dispose() {
        disposeBackend();
        this.removeAllListeners();
        if (_deviceList) {
            await _deviceList.dispose();
        }
    }

    getCurrentMethod() {
        return _callMethods;
    }

    getTransportInfo(): TransportInfo {
        if (_deviceList) {
            return _deviceList.getTransportInfo();
        }

        return {
            type: '',
            version: '',
            outdated: true,
        };
    }
}

/**
 * Init instance of Core event emitter.
 * @returns {Core}
 * @memberof Core
 */
export const initCore = () => {
    _core = new Core();
    return _core;
};

/**
 * Module initialization.
 * This will download the config.json, start DeviceList, init Core emitter instance.
 * Returns Core, an event emitter instance.
 * @param {Object} settings - optional // TODO
 * @returns {Promise<Core>}
 * @memberof Core
 */
export const init = async (settings: ConnectSettings) => {
    try {
        await DataManager.load(settings);
        enableLog(DataManager.getSettings('debug'));
        initCore();

        // If we're not in popup mode, set the interaction timeout to 0 (= disabled)
        _interactionTimeout = new InteractionTimeout(
            settings.popup ? settings.interactionTimeout : 0,
        );

        return _core;
    } catch (error) {
        // TODO: kill app
        _log.error('init', error);
        throw error;
    }
};

export const initTransport = async (settings: ConnectSettings) => {
    try {
        if (!settings.transportReconnect) {
            // try only once, if it fails kill and throw initialization error
            await initDeviceList(settings);
        } else {
            // don't wait for DeviceList result, further communication will be thru TRANSPORT events
            initDeviceList(settings);
        }
    } catch (error) {
        _log.error('initTransport', error);
        throw error;
    }
};

const disableWebUSBTransport = async () => {
    if (!_deviceList) return;
    if (_deviceList.transportType() !== 'WebUsbTransport') return;
    // override settings
    const settings = DataManager.getSettings();

    if (settings.transports?.includes('WebUsbTransport')) {
        settings.transports.splice(settings.transports.indexOf('WebUsbTransport'));
    }
    if (!settings.transports?.includes('BridgeTransport')) {
        settings.transports!.unshift('BridgeTransport');
    }

    try {
        // disconnect previous device list
        await _deviceList.dispose();
        // and init with new settings, without webusb
        await initDeviceList(settings);
    } catch (error) {
        // do nothing
    }
};
