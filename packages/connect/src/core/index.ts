/* eslint-disable @typescript-eslint/no-use-before-define */
import EventEmitter from 'events';

import { TRANSPORT, TRANSPORT_ERROR } from '@trezor/transport';
import { createLazy, createDeferred } from '@trezor/utils';
import { getSynchronize } from '@trezor/utils';
import { storage } from '@trezor/connect-common';

import { DataManager } from '../data/DataManager';
import { DeviceList } from '../device/DeviceList';
import { enhanceMessageWithAnalytics } from '../data/analyticsInfo';
import { ERRORS } from '../constants';
import {
    CORE_EVENT,
    RESPONSE_EVENT,
    UI,
    POPUP,
    IFRAME,
    DEVICE,
    createUiMessage,
    createPopupMessage,
    createDeviceMessage,
    createTransportMessage,
    createResponseMessage,
    TransportInfo,
    IFrameCallMessage,
    CoreRequestMessage,
    CoreEventMessage,
} from '../events';
import { getMethod } from './method';
import { AbstractMethod } from './AbstractMethod';
import { resolveAfter } from '../utils/promiseUtils';
import { createUiPromiseManager } from '../utils/uiPromiseManager';
import { createPopupPromiseManager } from '../utils/popupPromiseManager';
import { initLog, enableLog, setLogWriter, LogWriter } from '../utils/debug';
import { dispose as disposeBackend } from '../backend/BlockchainLink';
import { InteractionTimeout } from '../utils/interactionTimeout';
import type { DeviceEvents, Device } from '../device/Device';
import type { ConnectSettings, Device as DeviceTyped } from '../types';
import { onCallFirmwareUpdate } from './onCallFirmwareUpdate';

// Public variables
let _core: Core; // Class with event emitter
let _deviceList: DeviceList | undefined; // Instance of DeviceList
const _callMethods: AbstractMethod<any>[] = []; // generic type is irrelevant. only common functions are called at this level
let _interactionTimeout: InteractionTimeout;
let _deviceListInitTimeout: ReturnType<typeof setTimeout> | undefined;
let _overridePromise: Promise<void> | undefined;

const methodSynchronize = getSynchronize();
let waitForFirstMethod = createDeferred();

// custom log
const _log = initLog('Core');

/**
 * Emit message to listener (parent).
 * Clear method reference from _callMethods
 * @param {CoreMessage} message
 * @returns {void}
 * @memberof Core
 */
const postMessage = (message: CoreEventMessage) => {
    if (message.event === RESPONSE_EVENT) {
        const index = _callMethods.findIndex(call => call && call.responseID === message.id);
        if (index >= 0) {
            _callMethods.splice(index, 1);
            if (_callMethods.length === 0) {
                waitForFirstMethod = createDeferred();
            }
        }
    }
    _core.emit(CORE_EVENT, message);
};

const popupPromise = createPopupPromiseManager();

const waitForPopup = () => {
    postMessage(createUiMessage(UI.REQUEST_UI_WINDOW));

    return popupPromise.wait();
};

/**
 * Start interaction timeout timer
 */
const interactionTimeout = () =>
    _interactionTimeout.start(() => {
        onPopupClosed('Interaction timeout');
    });

const uiPromises = createUiPromiseManager(interactionTimeout);

/**
 * Find device by device path. Returned device may be unacquired.
 * @param {AbstractMethod} method
 * @returns {Promise<Device>}
 * @memberof Core
 */
const initDevice = async (devicePath?: string) => {
    if (!_deviceList) {
        throw ERRORS.TypedError('Transport_Missing');
    }

    // see initTransport.
    // if transportReconnect: true, initTransport does not wait to be finished. if there are multiple requested transports
    // in TrezorConnect.init, this method may emit UI.SELECT_DEVICE with wrong parameters (for example it thinks that it does not use weubsb although it should)
    await _deviceList.getTransportFirstEventPromise();

    if (!_deviceList) {
        // Need to check again if _deviceList is still available
        throw ERRORS.TypedError('Transport_Missing');
    }

    const isWebUsb = _deviceList.transportType() === 'WebUsbTransport';
    let device: Device | typeof undefined;
    let showDeviceSelection = isWebUsb;
    const isUsingPopup = DataManager.getSettings('popup');
    const origin = DataManager.getSettings('origin')!;
    const useCoreInPopup = DataManager.getSettings('useCoreInPopup');
    const { preferredDevice } = storage.load().origin[origin] || {};
    const preferredDeviceInList = preferredDevice && _deviceList.getDevice(preferredDevice.path);

    // we detected that there is a preferred device (user stored previously) but it's not in the list anymore (disconnected now)
    // we treat this situation as implicit forget
    if (preferredDevice && !preferredDeviceInList) {
        storage.save(store => {
            store.origin[origin] = { ...store.origin[origin], preferredDevice: undefined };

            return store;
        });
    }

    if (devicePath) {
        device = _deviceList.getDevice(devicePath);
        showDeviceSelection =
            !device || !!device?.unreadableError || (device.isUnacquired() && !!isUsingPopup);
    } else {
        const devices = _deviceList.asArray();
        if (devices.length === 1 && (!isWebUsb || !isUsingPopup)) {
            // there is only one device available. use it
            device = _deviceList.getDevice(devices[0].path);
            // Show device selection if device is unreadable or unacquired
            // Also in case of core in popup, so user can press "Remember device"
            showDeviceSelection =
                !!device?.unreadableError || device.isUnacquired() || !!useCoreInPopup;
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
        uiPromises.create(UI.RECEIVE_DEVICE);

        // wait for popup handshake
        await waitForPopup();

        // there is await above, _deviceList might have been set to undefined.
        if (!_deviceList) {
            throw ERRORS.TypedError('Transport_Missing');
        }

        // check again for available devices
        // there is a possible race condition before popup open
        const devices = _deviceList.asArray();
        if (
            devices.length === 1 &&
            devices[0].type !== 'unreadable' &&
            devices[0].features &&
            !isWebUsb &&
            !useCoreInPopup
        ) {
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
            if (uiPromises.exists(UI.RECEIVE_DEVICE)) {
                const { payload } = await uiPromises.get(UI.RECEIVE_DEVICE);
                if (payload.remember) {
                    const { label, path, state } = payload.device;
                    storage.save(store => {
                        store.origin[origin] = {
                            ...store.origin[origin],
                            preferredDevice: { label, path, state },
                        };

                        return store;
                    });
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

const MAX_PIN_TRIES = 3;

/** Including up to 3 pin tries **/
const getInvalidDeviceState = async (
    device: Device,
    preauthorized?: boolean,
): Promise<string | undefined> => {
    for (let i = 0; i < MAX_PIN_TRIES - 1; ++i) {
        try {
            return await device.validateState(preauthorized);
        } catch (error) {
            if (error.message.includes('PIN invalid')) {
                postMessage(createUiMessage(UI.INVALID_PIN, { device: device.toMessageObject() }));
            } else {
                throw error;
            }
        }
    }

    return device.validateState(preauthorized);
};

/**
 * This function will run inside Device.run() after device will be acquired and initialized
 */
const inner = async (method: AbstractMethod<any>, device: Device) => {
    const trustedHost = DataManager.getSettings('trustedHost');
    const isUsingPopup = DataManager.getSettings('popup') ?? false;

    const firmwareException = method.checkFirmwareRange();
    if (firmwareException) {
        if (isUsingPopup) {
            if (firmwareException === UI.FIRMWARE_NOT_COMPATIBLE) {
                // wait for popup handshake
                await waitForPopup();
                // initialize user response promise
                const uiPromise = uiPromises.create(UI.RECEIVE_CONFIRMATION, device);
                // show unexpected state information and wait for confirmation
                postMessage(createUiMessage(UI.FIRMWARE_NOT_COMPATIBLE, device.toMessageObject()));

                const uiResp = await uiPromise.promise;
                if (!uiResp.payload) {
                    throw ERRORS.TypedError('Method_PermissionsNotGranted');
                }
            } else {
                await waitForPopup();
                // show unexpected state information
                postMessage(createUiMessage(firmwareException, device.toMessageObject()));

                // wait for device disconnect
                await uiPromises.create(DEVICE.DISCONNECT, device).promise;

                // interrupt process and go to "final" block
                return Promise.reject(ERRORS.TypedError('Method_Cancel'));
            }
        } else {
            // return error if not using popup
            return Promise.reject(ERRORS.TypedError('Device_FwException', firmwareException));
        }
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
            await waitForPopup();
            // show unexpected state information
            postMessage(createUiMessage(unexpectedMode, device.toMessageObject()));

            // wait for device disconnect
            await uiPromises.create(DEVICE.DISCONNECT, device).promise;

            // interrupt process and go to "final" block
            return Promise.reject(ERRORS.TypedError('Device_ModeException', unexpectedMode));
        }

        // throw error if not using popup
        return Promise.reject(ERRORS.TypedError('Device_ModeException', unexpectedMode));
    }

    // check and request permissions [read, write...]
    method.checkPermissions();
    if (!trustedHost && method.requiredPermissions.length > 0) {
        // wait for popup window
        await waitForPopup();
        // initialize user response promise
        const uiPromise = uiPromises.create(UI.RECEIVE_PERMISSION, device);
        postMessage(
            createUiMessage(UI.REQUEST_PERMISSION, {
                permissions: method.requiredPermissions,
                device: device.toMessageObject(),
            }),
        );
        // wait for response
        const { granted, remember } = await uiPromise.promise.then(({ payload }) => payload);

        if (granted) {
            method.savePermissions(!remember);
        } else {
            // interrupt process and go to "final" block
            return Promise.reject(ERRORS.TypedError('Method_PermissionsNotGranted'));
        }
    }

    const deviceNeedsBackup = device.features.backup_availability === 'Required';
    if (deviceNeedsBackup) {
        if (
            method.noBackupConfirmationMode === 'always' ||
            (method.noBackupConfirmationMode === 'popup-only' && isUsingPopup)
        ) {
            // wait for popup window
            await waitForPopup();
            // initialize user response promise
            const uiPromise = uiPromises.create(UI.RECEIVE_CONFIRMATION, device);

            // request confirmation view
            postMessage(
                enhanceMessageWithAnalytics(
                    createUiMessage(UI.REQUEST_CONFIRMATION, {
                        view: 'no-backup',
                    }),
                    { device: device.toMessageObject() },
                ),
            );

            // wait for user action
            const permitted = await uiPromise.promise.then(({ payload }) => payload);

            if (!permitted) {
                // interrupt process and go to "final" block
                return Promise.reject(ERRORS.TypedError('Method_PermissionsNotGranted'));
            }
        }

        // wait for popup handshake
        await waitForPopup();
        // show notification
        postMessage(createUiMessage(UI.DEVICE_NEEDS_BACKUP, device.toMessageObject()));
    }

    // notify if firmware is outdated but not required
    if (device.firmwareStatus === 'outdated') {
        // wait for popup handshake
        await waitForPopup();
        // show notification
        postMessage(createUiMessage(UI.FIRMWARE_OUTDATED, device.toMessageObject()));
    }

    // ask for confirmation [export xpub, export info, sign message]
    if (!trustedHost) {
        const requestConfirmation = method.confirmation;
        if (requestConfirmation) {
            // wait for popup window
            await waitForPopup();
            // initialize user response promise
            const uiPromise = uiPromises.create(UI.RECEIVE_CONFIRMATION, device);

            // request confirmation view
            postMessage(
                enhanceMessageWithAnalytics(
                    createUiMessage(UI.REQUEST_CONFIRMATION, requestConfirmation),
                    { device: device.toMessageObject() },
                ),
            );

            // wait for user action
            const confirmed = await uiPromise.promise.then(({ payload }) => payload);
            if (!confirmed) {
                // interrupt process and go to "final" block
                return Promise.reject(ERRORS.TypedError('Method_Cancel'));
            }
        }
    }

    // Make sure that device will display pin/passphrase
    const isDeviceUnlocked = device.features.unlocked;
    if (method.useDeviceState) {
        try {
            let invalidDeviceState = await getInvalidDeviceState(device, method.preauthorized);
            if (isUsingPopup) {
                while (invalidDeviceState) {
                    const uiPromise = uiPromises.create(UI.INVALID_PASSPHRASE_ACTION, device);
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
                        await device.initialize(method.useCardanoDerivation);

                        invalidDeviceState = await getInvalidDeviceState(
                            device,
                            method.preauthorized,
                        );
                    } else {
                        // set new state as requested
                        device.setExternalState(invalidDeviceState);
                        break;
                    }
                }
            } else if (invalidDeviceState) {
                throw ERRORS.TypedError('Device_InvalidState');
            }
        } catch (error) {
            // other error
            // postMessage(ResponseMessage(method.responseID, false, { error }));
            // closePopup();
            // clear cached passphrase. it's not valid
            device.setInternalState(undefined);

            // interrupt process and go to "final" block
            return Promise.reject(error);
        }
    }

    // emit additional CHANGE event if device becomes unlocked after authorization
    // features were automatically updated after PinMatrixAck in DeviceCommands
    if (!isDeviceUnlocked && device.features.unlocked) {
        postMessage(createDeviceMessage(DEVICE.CHANGED, device.toMessageObject()));
    }

    if (method.useUi) {
        // make sure that popup is opened
        await waitForPopup();
    } else {
        // popup is not required
        postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
    }

    // run method
    try {
        const response = await method.run();

        return createResponseMessage(method.responseID, true, response);
    } catch (error) {
        return Promise.reject(error);
    }
};

/**
 * Processing incoming message.
 * This method is async that's why it returns Promise but the real response is passed by postMessage(ResponseMessage)
 * @param {CoreMessage} message
 * @returns {Promise<void>}
 * @memberof Core
 */
const onCall = async (message: IFrameCallMessage) => {
    if (!message.id || !message.payload || message.type !== IFRAME.CALL) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'onCall: message.id or message.payload is missing',
        );
    }

    const responseID = message.id;
    const origin = DataManager.getSettings('origin')!;
    const env = DataManager.getSettings('env')!;
    const useCoreInPopup = DataManager.getSettings('useCoreInPopup');

    const { preferredDevice } = storage.loadForOrigin(origin) || {};
    if (preferredDevice && !message.payload.device) {
        message.payload.device = preferredDevice;
    }

    // find method and parse incoming params
    let method: AbstractMethod<any>;
    let messageResponse: CoreEventMessage;
    try {
        method = await methodSynchronize(async () => {
            _log.debug('loading method...');
            const method = await getMethod(message);
            _log.debug('method selected', method.name);
            // bind callbacks
            method.postMessage = postMessage;
            method.createUiPromise = uiPromises.create;
            // start validation process
            method.init();
            await method.initAsync?.();

            return method;
        });
        waitForFirstMethod.resolve();
        _callMethods.push(method);
    } catch (error) {
        postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
        postMessage(createResponseMessage(responseID, false, { error }));

        return Promise.resolve();
    }

    // this method is not using the device, there is no need to acquire
    if (!method.useDevice) {
        try {
            if (method.useUi) {
                // wait for popup handshake
                await waitForPopup();
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
        await initDeviceList(false);
    }

    if (method.isManagementRestricted()) {
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
        device = await initDevice(method.devicePath);
    } catch (error) {
        if (error.code === 'Transport_Missing') {
            // wait for popup handshake
            await waitForPopup();
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
        _overridePromise = device.override(overrideError);
        await _overridePromise;
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
    device.on(DEVICE.SAVE_STATE, (state: string) => {
        // Persist internal state only in case of core in popup
        // Currently also only for webextension until we asses security implications
        if (useCoreInPopup && env === 'webextension') {
            storage.saveForOrigin(store => {
                return {
                    ...store,
                    preferredDevice: store.preferredDevice
                        ? {
                              ...store.preferredDevice,
                              internalState: state,
                              internalStateExpiration: Date.now() + 1000 * 60 * 15, // 15 minutes
                          }
                        : undefined,
                };
            }, origin);
        }
    });

    if (!device.getInternalState() && useCoreInPopup && env === 'webextension') {
        // Restore internal state if available
        const { preferredDevice } = storage.loadForOrigin(origin) || {};
        if (
            preferredDevice?.internalState &&
            preferredDevice?.internalStateExpiration &&
            preferredDevice.internalStateExpiration > new Date().getTime()
        ) {
            device.setInternalState(preferredDevice.internalState);
        }
    }

    try {
        // run inner function
        if (_overridePromise) {
            await _overridePromise;
        }
        const innerAction = () =>
            inner(method, device).then(response => {
                messageResponse = response;
            });

        await device.run(innerAction, {
            keepSession: method.keepSession,
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
            if (_deviceList && error.message === TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS) {
                await _deviceList.enumerate();
            }
            messageResponse = createResponseMessage(method.responseID, false, { error });
        }
    } finally {
        if (_overridePromise) {
            await _overridePromise;
        }
        // Work done

        // TODO: This requires a massive refactoring https://github.com/trezor/trezor-suite/issues/5323
        // @ts-expect-error TODO: messageResponse should be assigned from the response of "inner" function
        const response = messageResponse;

        if (response) {
            if (method.name === 'rebootToBootloader' && response.success) {
                // Wait for device to switch to bootloader
                // This delay is crucial see https://github.com/trezor/trezor-firmware/issues/1983
                await resolveAfter(1000).promise;
                // call Device.run with empty function to fetch new Features
                // (acquire > Initialize > nothing > release)
                try {
                    await device.run(() => Promise.resolve(), { skipFinalReload: true });
                } catch (err) {
                    // ignore. on model T, this block of code is probably not needed at all. but I am keeping it here for
                    // backwards compatibility
                }
            }

            await device.cleanup();

            if (useCoreInPopup) {
                // We need to send response before closing popup
                postMessage(response);
            }

            closePopup();
            cleanup();

            if (method) {
                method.dispose();
            }

            if (_deviceList) {
                if (response.success) {
                    _deviceList.removeAuthPenalty(device);
                }
            }

            if (!useCoreInPopup) {
                postMessage(response);
            }
        }
    }
};

/**
 * Clean up all variables and references.
 * @returns {void}
 * @memberof Core
 */
const cleanup = () => {
    popupPromise.clear();
    uiPromises.clear();
    _interactionTimeout.stop();
    _log.debug('Cleanup...');
};

/**
 * Force close popup.
 * @returns {void}
 * @memberof Core
 */
const closePopup = () => {
    if (popupPromise.isWaiting()) {
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
    ...[device, request, method]: [...Parameters<DeviceEvents['button']>, AbstractMethod<any>]
) => {
    // wait for popup handshake
    const addressRequest = request.code === 'ButtonRequest_Address';
    if (!addressRequest || (addressRequest && method.useUi)) {
        await waitForPopup();
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
const onDevicePinHandler: DeviceEvents['pin'] = async (...[device, type, callback]) => {
    // wait for popup handshake
    await waitForPopup();
    // create ui promise
    const uiPromise = uiPromises.create(UI.RECEIVE_PIN, device);
    // request pin view
    postMessage(createUiMessage(UI.REQUEST_PIN, { device: device.toMessageObject(), type }));
    // wait for pin
    const uiResp = await uiPromise.promise;
    // callback.apply(null, [null, pin]);
    callback(null, uiResp.payload);
};

const onDeviceWordHandler: DeviceEvents['word'] = async (...[device, type, callback]) => {
    // wait for popup handshake
    await waitForPopup();
    // create ui promise
    const uiPromise = uiPromises.create(UI.RECEIVE_WORD, device);
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
const onDevicePassphraseHandler: DeviceEvents['passphrase'] = async (...[device, callback]) => {
    // wait for popup handshake
    await waitForPopup();
    // create ui promise
    const uiPromise = uiPromises.create(UI.RECEIVE_PASSPHRASE, device);
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
const onEmptyPassphraseHandler: DeviceEvents['passphrase'] = (...[_, callback]) => {
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
                _overridePromise = d.interruptionFromUser(error);
            } else {
                const success = uiPromises.resolve({ type: DEVICE.DISCONNECT, payload: undefined });
                if (!success) {
                    _callMethods.forEach(m => {
                        postMessage(createResponseMessage(m.responseID, false, { error }));
                    });
                    _callMethods.splice(0, _callMethods.length);
                    waitForFirstMethod = createDeferred();
                }
            }
        });
        // Waiting for device. Throw error before onCall try/catch block
    } else {
        uiPromises.rejectAll(error);
        popupPromise.reject(error);
    }
    cleanup();
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
    const promiseExists = uiPromises.exists(UI.RECEIVE_DEVICE);
    if (promiseExists && _deviceList) {
        const list = _deviceList.asArray();
        const isWebUsb = _deviceList.transportType() === 'WebUsbTransport';

        if (list.length === 1 && !isWebUsb) {
            // there is only one device. use it
            // resolve uiPromise to looks like it's a user choice (see: handleMessage function)
            uiPromises.resolve({
                type: UI.RECEIVE_DEVICE,
                payload: { device: list[0] },
            });
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
        const shouldClosePopup = uiPromises.disconnected(path);

        if (shouldClosePopup) {
            closePopup();
            cleanup();
        }
    }
};

/**
 * Start DeviceList with listeners.
 * @param {boolean} transportReconnect
 * @returns {Promise<void>}
 * @memberof Core
 */
const initDeviceList = async (transportReconnect?: boolean) => {
    try {
        const { debug, transports, priority, pendingTransportEvent } = DataManager.getSettings();
        const messages = DataManager.getProtobufMessages();

        _deviceList = new DeviceList({ debug, messages, priority });

        _deviceList.setTransports(transports);

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

        _deviceList.on(TRANSPORT.ERROR, error => {
            _log.warn('TRANSPORT.ERROR', error);

            if (_deviceList) {
                _deviceList.disconnectDevices();
                _deviceList.dispose();
            }

            _deviceList = undefined;

            postMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
            // if transport fails during app lifetime, try to reconnect
            if (transportReconnect) {
                const { promise, timeout } = resolveAfter(1000, null);
                _deviceListInitTimeout = timeout;
                promise.then(() => {
                    initDeviceList(transportReconnect);
                });
            }
        });

        _deviceList.on(TRANSPORT.START, transportType =>
            postMessage(createTransportMessage(TRANSPORT.START, transportType)),
        );

        _deviceList.init(pendingTransportEvent);
        if (_deviceList) {
            await _deviceList.waitForTransportFirstEvent();
        }
    } catch (error) {
        _deviceList = undefined;
        postMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
        if (!transportReconnect) {
            throw error;
        } else {
            const { promise, timeout } = resolveAfter(3000, null);
            _deviceListInitTimeout = timeout;
            await promise;
            // try to reconnect
            await initDeviceList(transportReconnect);
        }
    }
};

/**
 * An event emitter for communication with parent
 * @extends EventEmitter
 * @memberof Core
 */
export class Core extends EventEmitter {
    abortController = new AbortController();

    handleMessage(message: CoreRequestMessage) {
        _log.debug('handleMessage', message);

        switch (message.type) {
            case POPUP.HANDSHAKE:
                popupPromise.resolve();
                break;
            case POPUP.CLOSED:
                popupPromise.clear();
                onPopupClosed(message.payload ? message.payload.error : null);
                break;

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

            case TRANSPORT.GET_INFO:
                postMessage(createResponseMessage(message.id, true, this.getTransportInfo()));
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
            case UI.LOGIN_CHALLENGE_RESPONSE:
                uiPromises.resolve(message);
                break;

            // message from index
            case IFRAME.CALL:
                // firmwareUpdate is the only procedure that expects device disconnecting
                // and reconnecting during the process. Due to this it can't be handled just
                // like regular methods using onCall function. In onCall, disconnecting device
                // means that call immediately returns error.
                if (message.payload.method === 'firmwareUpdate') {
                    onCallFirmwareUpdate({
                        params: message.payload,
                        context: {
                            deviceList: _deviceList!,
                            postMessage,
                            initDevice,
                            log: _log,
                            abortSignal: this.abortController.signal,
                        },
                    })
                        .then(payload => {
                            postMessage(createResponseMessage(message.id, true, payload));
                        })
                        .catch(error => {
                            postMessage(createResponseMessage(message.id, false, { error }));
                            _log.error('onCallFirmwareUpdate', error);
                        });
                } else {
                    onCall(message).catch(error => {
                        _log.error('onCall', error);
                    });
                }
        }
    }

    dispose() {
        disposeBackend();
        if (_deviceListInitTimeout) {
            clearTimeout(_deviceListInitTimeout);
        }
        this.removeAllListeners();
        this.abortController.abort();
        if (_deviceList) {
            _deviceList.dispose();
        }
    }

    async getCurrentMethod() {
        await waitForFirstMethod.promise;

        return await methodSynchronize(() => _callMethods[0]);
    }

    getTransportInfo(): TransportInfo | undefined {
        if (!_deviceList) {
            return undefined;
        }

        return _deviceList.getTransportInfo();
    }

    enumerate() {
        if (!_deviceList) {
            return;
        }
        _deviceList.enumerate();
    }

    async init(
        settings: ConnectSettings,
        onCoreEvent: (message: CoreEventMessage) => void,
        logWriterFactory?: () => LogWriter | undefined,
    ) {
        if (logWriterFactory) {
            setLogWriter(logWriterFactory);
        }
        try {
            await DataManager.load(settings);
            enableLog(DataManager.getSettings('debug'));

            // TODO NOTE: i'm leaving reference to avoid complex changes, top-level reference is used by methods above Core context
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            _core = this;

            // If we're not in popup mode, set the interaction timeout to 0 (= disabled)
            _interactionTimeout = new InteractionTimeout(
                settings.popup ? settings.interactionTimeout : 0,
            );

            this.on(CORE_EVENT, onCoreEvent);
        } catch (error) {
            // TODO: kill app
            _log.error('init', error);
            throw error;
        }

        try {
            if (
                !DataManager.getSettings('transportReconnect') ||
                // in auto core mode, we have to wait to check if transport is available
                DataManager.getSettings('coreMode') === 'auto'
            ) {
                // try only once, if it fails kill and throw initialization error
                await initDeviceList(false);
            } else {
                // don't wait for DeviceList result, further communication will be thru TRANSPORT events
                initDeviceList(true);
            }
        } catch (error) {
            _log.error('initTransport', error);
            throw error;
        }
    }
}

const disableWebUSBTransport = async () => {
    if (!_deviceList) return;
    if (_deviceList.transportType() !== 'WebUsbTransport') return;
    // override settings
    const settings = DataManager.getSettings();

    if (settings.transports) {
        const transportStr = settings.transports?.filter(
            transport => typeof transport !== 'object',
        );
        if (transportStr.includes('WebUsbTransport')) {
            settings.transports.splice(settings.transports.indexOf('WebUsbTransport'), 1);
        }
        if (!transportStr.includes('BridgeTransport')) {
            settings.transports!.unshift('BridgeTransport');
        }
    }

    try {
        // disconnect previous device list
        _deviceList.dispose();
        // and init with new settings, without webusb
        await initDeviceList(settings.transportReconnect);
    } catch (error) {
        // do nothing
    }
};

const initCore = async (
    settings: ConnectSettings,
    onCoreEvent: (message: CoreEventMessage) => void,
    logWriterFactory?: () => LogWriter,
) => {
    const core = new Core();
    let promise: Promise<void>;

    // do not send any event until Core is fully loaded
    // DeviceList emits TRANSPORT and DEVICE events if pendingTransportEvent is set
    const eventThrottle = (...args: Parameters<typeof onCoreEvent>) =>
        promise
            .then(() => {
                setTimeout(() => onCoreEvent(...args), 0);
            })
            .catch(() => {});

    promise = core.init(settings, eventThrottle, logWriterFactory);
    await promise;

    // Core initialized successfully, disable throttle
    core.on(CORE_EVENT, onCoreEvent);
    core.off(CORE_EVENT, eventThrottle);

    return core;
};

const disposeCore = (core: Core) => {
    core.dispose();
};

/**
 * State initialization
 */
export const initCoreState = () => createLazy(initCore, disposeCore);
