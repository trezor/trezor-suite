/* eslint-disable @typescript-eslint/no-use-before-define */
import EventEmitter from 'events';

import { TRANSPORT, TRANSPORT_ERROR } from '@trezor/transport';
import { createLazy, createDeferred, throwError } from '@trezor/utils';
import { getSynchronize } from '@trezor/utils';
import { storage } from '@trezor/connect-common';

import { DataManager } from '../data/DataManager';
import { DeviceList, IDeviceList, assertDeviceListConnected } from '../device/DeviceList';
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
import type { ConnectSettings, Device as DeviceTyped, StaticSessionId } from '../types';
import { onCallFirmwareUpdate } from './onCallFirmwareUpdate';
import { WebextensionStateStorage } from '../device/StateStorage';

// custom log
const _log = initLog('Core');

type CoreContext = ReturnType<Core['getCoreContext']>;

const waitForPopup = ({ popupPromise, sendCoreMessage }: CoreContext) => {
    sendCoreMessage(createUiMessage(UI.REQUEST_UI_WINDOW));

    return popupPromise.wait();
};

/**
 * Start interaction timeout timer
 */
const startInteractionTimeout = (context: CoreContext) =>
    context.interactionTimeout.start(() => {
        onPopupClosed(context, 'Interaction timeout');
    });

/**
 * Find device by device path. Returned device may be unacquired.
 * @param {AbstractMethod} method
 * @returns {Promise<Device>}
 * @memberof Core
 */
const initDevice = async (context: CoreContext, devicePath?: string) => {
    const { uiPromises, deviceList, sendCoreMessage } = context;

    assertDeviceListConnected(deviceList);

    const isWebUsb = deviceList.transportType() === 'WebUsbTransport';
    let device: Device | typeof undefined;
    let showDeviceSelection = isWebUsb;
    const isUsingPopup = DataManager.getSettings('popup');
    const origin = DataManager.getSettings('origin')!;
    const useCoreInPopup = DataManager.getSettings('useCoreInPopup');
    const { preferredDevice } = storage.load().origin[origin] || {};
    const preferredDeviceInList = preferredDevice && deviceList.getDevice(preferredDevice.path);

    // we detected that there is a preferred device (user stored previously) but it's not in the list anymore (disconnected now)
    // we treat this situation as implicit forget
    if (preferredDevice && !preferredDeviceInList) {
        storage.save(store => {
            store.origin[origin] = { ...store.origin[origin], preferredDevice: undefined };

            return store;
        });
    }

    if (devicePath) {
        device = deviceList.getDevice(devicePath);
        showDeviceSelection =
            !device || !!device?.unreadableError || (device.isUnacquired() && !!isUsingPopup);
    } else {
        const devices = deviceList.asArray();
        if (devices.length === 1 && (!isWebUsb || !isUsingPopup)) {
            // there is only one device available. use it
            device = deviceList.getDevice(devices[0].path);
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
        await waitForPopup(context);

        // there is await above, _deviceList might have been disconnected.
        assertDeviceListConnected(deviceList);

        // check again for available devices
        // there is a possible race condition before popup open
        const devices = deviceList.asArray();
        if (
            devices.length === 1 &&
            devices[0].type !== 'unreadable' &&
            devices[0].features &&
            !isWebUsb &&
            !useCoreInPopup
        ) {
            // there is one device available. use it
            device = deviceList.getDevice(devices[0].path);
        } else {
            // request select device view
            sendCoreMessage(
                createUiMessage(UI.SELECT_DEVICE, {
                    webusb: isWebUsb,
                    devices: deviceList.asArray(),
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
                device = deviceList.getDevice(payload.device.path);
            }
        }
    } else if (uiPromises.exists(UI.RECEIVE_DEVICE)) {
        // In case of second method call quickly after the first one, wait for device selection
        // (if created during the first call) even if showDeviceSelection is false now
        await uiPromises.get(UI.RECEIVE_DEVICE);
    }

    if (!device) {
        throw ERRORS.TypedError('Device_NotFound');
    }

    return device;
};

const MAX_PIN_TRIES = 3;

/** Including up to 3 pin tries **/
const getInvalidDeviceState = async (
    { sendCoreMessage }: CoreContext,
    device: Device,
    method: AbstractMethod<any>,
): Promise<StaticSessionId | undefined> => {
    for (let i = 0; i < MAX_PIN_TRIES - 1; ++i) {
        try {
            return await device.validateState(method.preauthorized, method.useCardanoDerivation);
        } catch (error) {
            if (error.message.includes('PIN invalid')) {
                sendCoreMessage(
                    createUiMessage(UI.INVALID_PIN, { device: device.toMessageObject() }),
                );
            } else {
                throw error;
            }
        }
    }

    return device.validateState(method.preauthorized, method.useCardanoDerivation);
};

/**
 * This function will run inside Device.run() after device will be acquired and initialized
 */
const inner = async (context: CoreContext, method: AbstractMethod<any>, device: Device) => {
    const { uiPromises, sendCoreMessage } = context;
    const trustedHost = DataManager.getSettings('trustedHost');
    const isUsingPopup = DataManager.getSettings('popup') ?? false;

    const firmwareException = method.checkFirmwareRange();
    if (firmwareException) {
        if (isUsingPopup) {
            if (firmwareException === UI.FIRMWARE_NOT_COMPATIBLE) {
                // wait for popup handshake
                await waitForPopup(context);
                // initialize user response promise
                const uiPromise = uiPromises.create(UI.RECEIVE_CONFIRMATION, device);
                // show unexpected state information and wait for confirmation
                sendCoreMessage(
                    createUiMessage(UI.FIRMWARE_NOT_COMPATIBLE, device.toMessageObject()),
                );

                const uiResp = await uiPromise.promise;
                if (!uiResp.payload) {
                    throw ERRORS.TypedError('Method_PermissionsNotGranted');
                }
            } else {
                await waitForPopup(context);
                // show unexpected state information
                sendCoreMessage(createUiMessage(firmwareException, device.toMessageObject()));

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
        device.keepTransportSession = false;
        if (isUsingPopup) {
            // wait for popup handshake
            await waitForPopup(context);
            // show unexpected state information
            sendCoreMessage(createUiMessage(unexpectedMode, device.toMessageObject()));

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
        await waitForPopup(context);
        // initialize user response promise
        const uiPromise = uiPromises.create(UI.RECEIVE_PERMISSION, device);
        sendCoreMessage(
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
            await waitForPopup(context);
            // initialize user response promise
            const uiPromise = uiPromises.create(UI.RECEIVE_CONFIRMATION, device);

            // request confirmation view
            sendCoreMessage(
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
        await waitForPopup(context);
        // show notification
        sendCoreMessage(createUiMessage(UI.DEVICE_NEEDS_BACKUP, device.toMessageObject()));
    }

    // notify if firmware is outdated but not required
    if (device.firmwareStatus === 'outdated') {
        // wait for popup handshake
        await waitForPopup(context);
        // show notification
        sendCoreMessage(createUiMessage(UI.FIRMWARE_OUTDATED, device.toMessageObject()));
    }

    // ask for confirmation [export xpub, export info, sign message]
    if (!trustedHost) {
        const requestConfirmation = method.confirmation;
        if (requestConfirmation) {
            // wait for popup window
            await waitForPopup(context);
            // initialize user response promise
            const uiPromise = uiPromises.create(UI.RECEIVE_CONFIRMATION, device);

            // request confirmation view
            sendCoreMessage(
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
            let invalidDeviceState = await getInvalidDeviceState(context, device, method);
            if (isUsingPopup) {
                while (invalidDeviceState) {
                    const uiPromise = uiPromises.create(UI.INVALID_PASSPHRASE_ACTION, device);
                    // request action view
                    sendCoreMessage(
                        createUiMessage(UI.INVALID_PASSPHRASE, {
                            device: device.toMessageObject(),
                        }),
                    );
                    // wait for user response
                    const uiResp = await uiPromise.promise;
                    if (uiResp.payload) {
                        // reset sessionId and try again
                        device.setState({ sessionId: undefined });
                        await device.initialize(method.useCardanoDerivation);

                        invalidDeviceState = await getInvalidDeviceState(context, device, method);
                    } else {
                        // set new state as requested
                        device.setState({ staticSessionId: invalidDeviceState });
                        break;
                    }
                }
            } else if (invalidDeviceState) {
                throw ERRORS.TypedError('Device_InvalidState');
            }
        } catch (error) {
            // other error
            // sendCoreMessage(ResponseMessage(method.responseID, false, { error }));
            // closePopup();
            // clear cached passphrase. it's not valid
            device.setState({ sessionId: undefined });

            // interrupt process and go to "final" block
            return Promise.reject(error);
        }
    }

    // emit additional CHANGE event if device becomes unlocked after authorization
    // features were automatically updated after PinMatrixAck in DeviceCommands
    if (!isDeviceUnlocked && device.features.unlocked) {
        sendCoreMessage(createDeviceMessage(DEVICE.CHANGED, device.toMessageObject()));
    }

    if (method.useUi) {
        // make sure that popup is opened
        await waitForPopup(context);
    } else {
        // popup is not required
        sendCoreMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
    }

    // run method
    try {
        const response = await method.run();

        return createResponseMessage(method.responseID, true, response, device);
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
const onCall = async (context: CoreContext, message: IFrameCallMessage) => {
    if (!message.id || !message.payload || message.type !== IFRAME.CALL) {
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
    const origin = DataManager.getSettings('origin')!;

    const { preferredDevice } = storage.loadForOrigin(origin) || {};
    if (preferredDevice && !message.payload.device) {
        message.payload.device = preferredDevice;
    }

    // find method and parse incoming params
    let method: AbstractMethod<any>;
    try {
        method = await methodSynchronize(async () => {
            _log.debug('loading method...');
            const method = await getMethod(message);
            _log.debug('method selected', method.name);
            // bind callbacks
            method.postMessage = sendCoreMessage;
            method.createUiPromise = uiPromises.create;
            // start validation process
            method.init();
            await method.initAsync?.();

            return method;
        });
        resolveWaitForFirstMethod();
        callMethods.push(method);
    } catch (error) {
        sendCoreMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
        sendCoreMessage(createResponseMessage(responseID, false, { error }));

        return Promise.resolve();
    }

    if (method.payload.__info) {
        const response = method.getMethodInfo();
        sendCoreMessage(createResponseMessage(method.responseID, true, response));

        return Promise.resolve();
    }

    // this method is not using the device, there is no need to acquire
    if (!method.useDevice) {
        try {
            if (method.useUi) {
                // wait for popup handshake
                await waitForPopup(context);
            } else {
                // cancel popup request
                sendCoreMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
            }

            const response = await method.run();
            sendCoreMessage(createResponseMessage(method.responseID, true, response));
        } catch (error) {
            sendCoreMessage(createResponseMessage(method.responseID, false, { error }));
        }

        return Promise.resolve();
    }

    if (method.isManagementRestricted()) {
        sendCoreMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
        sendCoreMessage(
            createResponseMessage(responseID, false, {
                error: ERRORS.TypedError('Method_NotAllowed'),
            }),
        );

        return Promise.resolve();
    }

    return await onCallDevice(context, message, method);
};

const onCallDevice = async (
    context: CoreContext,
    message: IFrameCallMessage,
    method: AbstractMethod<any>,
): Promise<void> => {
    const { deviceList, callMethods, getOverridePromise, setOverridePromise, sendCoreMessage } =
        context;
    const responseID = message.id;
    const { origin, env, useCoreInPopup } = DataManager.getSettings();

    if (!deviceList.isConnected() && !deviceList.pendingConnection()) {
        // transport is missing try to initialize it once again
        deviceList.init();
    }
    await deviceList.pendingConnection();

    const shouldRetry = ['web', 'webextension'].includes(env);
    // find device
    let tempDevice: Device | undefined;
    while (!tempDevice) {
        try {
            tempDevice = await initDevice(context, method.devicePath);
        } catch (error) {
            if (error.code === 'Transport_Missing') {
                // wait for popup handshake
                await waitForPopup(context);
                // show message about transport
                sendCoreMessage(createUiMessage(UI.TRANSPORT));

                // Retry initDevice again
                // NOTE: this should change after multi-transports refactor, where transport will be always alive
                if (deviceList.pendingConnection() && shouldRetry) {
                    while (deviceList.pendingConnection()) {
                        await deviceList.pendingConnection();
                    }
                    continue;
                }
            } else {
                // cancel popup request
                sendCoreMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
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
        setOverridePromise(device.override(overrideError));
        await getOverridePromise();
        // if current method was overridden while waiting for device.override result
        // return response with status false
        if (method.overridden) {
            sendCoreMessage(
                createResponseMessage(method.responseID, false, { error: overrideError }),
            );
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
            // sendCoreMessage(UiMessage(POPUP.CANCEL_POPUP_REQUEST));
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

    if (method.hasExpectedDeviceState) {
        device.setState(method.deviceState);
    }

    // device is available
    // set public variables, listeners and run method
    device.on(DEVICE.BUTTON, onDeviceButtonHandler(context, method));
    device.on(DEVICE.PIN, onDevicePinHandler(context));
    device.on(DEVICE.WORD, onDeviceWordHandler(context));
    device.on(
        DEVICE.PASSPHRASE,
        (method.useEmptyPassphrase ? onEmptyPassphraseHandler : onDevicePassphraseHandler)(context),
    );
    device.on(DEVICE.PASSPHRASE_ON_DEVICE, () => {
        sendCoreMessage(
            createUiMessage(UI.REQUEST_PASSPHRASE_ON_DEVICE, { device: device.toMessageObject() }),
        );
    });
    device.on(DEVICE.THP_PAIRING, onThpPairingHandler(context));
    device.on(DEVICE.TRANSPORT_STATE_CHANGED, () => {
        postMessage(createDeviceMessage(DEVICE.TRANSPORT_STATE_CHANGED, device.toMessageObject()));
    });

    if (useCoreInPopup && env === 'webextension' && origin) {
        device.initStorage(new WebextensionStateStorage(origin));
    }

    let messageResponse: CoreEventMessage;

    try {
        // run inner function
        if (getOverridePromise()) {
            await getOverridePromise();
        }
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
        // TODO This condition has to be there; awaiting undefined breaks e2e tests, which is a complete mystery
        if (getOverridePromise()) {
            await getOverridePromise();
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
                sendCoreMessage(response);
            }

            closePopup(context);
            cleanup(context);

            if (method) {
                method.dispose();
            }

            if (response.success) {
                deviceList.removeAuthPenalty(device);
            }

            if (!useCoreInPopup) {
                sendCoreMessage(response);
            }
        }
    }
};

/**
 * Clean up all variables and references.
 * @returns {void}
 * @memberof Core
 */
const cleanup = ({ uiPromises, popupPromise, interactionTimeout }: CoreContext) => {
    popupPromise.clear();
    uiPromises.clear();
    interactionTimeout.stop();
    _log.debug('Cleanup...');
};

/**
 * Force close popup.
 * @returns {void}
 * @memberof Core
 */
const closePopup = ({ popupPromise, sendCoreMessage }: CoreContext) => {
    if (popupPromise.isWaiting()) {
        sendCoreMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
    }
    sendCoreMessage(createUiMessage(UI.CLOSE_UI_WINDOW));
};

/**
 * Handle button request from Device.
 * @param {Device} device
 * @param {string} protobuf.ButtonRequest
 * @returns {Promise<void>}
 * @memberof Core
 */
const onDeviceButtonHandler =
    (context: CoreContext, method: AbstractMethod<any>): DeviceEvents['button'] =>
    async (...[device, request]) => {
        const { sendCoreMessage } = context;
        // wait for popup handshake
        const addressRequest = request.code === 'ButtonRequest_Address';
        if (!addressRequest || (addressRequest && method.useUi)) {
            await waitForPopup(context);
        }
        const data =
            typeof method.getButtonRequestData === 'function' && request.code
                ? method.getButtonRequestData(request.code)
                : undefined;
        // interaction timeout
        startInteractionTimeout(context);
        // request view
        sendCoreMessage(
            createDeviceMessage(DEVICE.BUTTON, { ...request, device: device.toMessageObject() }),
        );
        sendCoreMessage(
            createUiMessage(UI.REQUEST_BUTTON, {
                ...request,
                device: device.toMessageObject(),
                data,
            }),
        );
        if (addressRequest && !method.useUi) {
            sendCoreMessage(createUiMessage(UI.ADDRESS_VALIDATION, data));
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
const onDevicePinHandler =
    (context: CoreContext): DeviceEvents['pin'] =>
    async (...[device, type, callback]) => {
        const { uiPromises, sendCoreMessage } = context;
        // wait for popup handshake
        await waitForPopup(context);
        // create ui promise
        const uiPromise = uiPromises.create(UI.RECEIVE_PIN, device);
        // request pin view
        sendCoreMessage(
            createUiMessage(UI.REQUEST_PIN, { device: device.toMessageObject(), type }),
        );
        // wait for pin
        try {
            const uiResp = await uiPromise.promise;
            callback(uiResp.payload);
        } catch (error) {
            callback(null, error);
        }
    };

const onDeviceWordHandler =
    (context: CoreContext): DeviceEvents['word'] =>
    async (...[device, type, callback]) => {
        const { uiPromises, sendCoreMessage } = context;
        // wait for popup handshake
        await waitForPopup(context);
        // create ui promise
        const uiPromise = uiPromises.create(UI.RECEIVE_WORD, device);
        sendCoreMessage(
            createUiMessage(UI.REQUEST_WORD, { device: device.toMessageObject(), type }),
        );
        // wait for word
        try {
            const uiResp = await uiPromise.promise;
            callback(uiResp.payload);
        } catch (error) {
            callback(null, error);
        }
    };

/**
 * Handle passphrase request from Device.
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */
const onDevicePassphraseHandler =
    (context: CoreContext): DeviceEvents['passphrase'] =>
    async (...[device, callback]) => {
        const { uiPromises, sendCoreMessage } = context;
        // wait for popup handshake
        await waitForPopup(context);
        // create ui promise
        const uiPromise = uiPromises.create(UI.RECEIVE_PASSPHRASE, device);
        // request passphrase view
        sendCoreMessage(
            createUiMessage(UI.REQUEST_PASSPHRASE, { device: device.toMessageObject() }),
        );
        // wait for passphrase
        try {
            const uiResp = await uiPromise.promise;
            callback(uiResp.payload);
        } catch (error) {
            callback(null, error);
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
    (): DeviceEvents['passphrase'] =>
    (...[_, callback]) => {
        callback({ value: '' });
    };

const onThpPairingHandler =
    (context: CoreContext): DeviceEvents['thp_pairing'] =>
    async (...[device, callback]) => {
        const { uiPromises, sendCoreMessage } = context;
        // wait for popup handshake
        await waitForPopup(context);
        // create ui promise
        const uiPromise = uiPromises.create(UI.RECEIVE_THP_PAIRING_TAG, device);
        sendCoreMessage(
            createUiMessage(UI.REQUEST_THP_PAIRING, {
                device: device.toMessageObject(),
                type: device.protocolState.handshakeCredentials?.pairingMethods || [],
            }),
        );
        // wait for response
        try {
            const uiResp = await uiPromise.promise;
            console.log('RECEIVED THP TAG', uiResp);
            callback(uiResp.payload);
        } catch (error) {
            console.log('RECEIVED THP TAG error', error);
            callback(null, error);
        }
    };

/**
 * Handle popup closed by user.
 * @returns {void}
 * @memberof Core
 */
const onPopupClosed = (context: CoreContext, customErrorMessage?: string) => {
    const {
        uiPromises,
        popupPromise,
        deviceList,
        callMethods,
        resetWaitForFirstMethod,
        setOverridePromise,
        sendCoreMessage,
    } = context;
    const error = customErrorMessage
        ? ERRORS.TypedError('Method_Cancel', customErrorMessage)
        : ERRORS.TypedError('Method_Interrupted');
    // Device was already acquired. Try to interrupt running action which will throw error from onCall try/catch block
    if (deviceList.isConnected() && deviceList.asArray().length > 0) {
        deviceList.allDevices().forEach(d => {
            d.keepTransportSession = false; // clear transportSession on release
            if (d.isUsedHere()) {
                setOverridePromise(d.interruptionFromUser(error));
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
        popupPromise.reject(error);
    }
    cleanup(context);
};

/**
 * Handle DeviceList changes.
 * If there is uiPromise waiting for device selection update view.
 * Used in initDevice function
 * @param {DeviceTyped} interruptDevice
 * @returns {void}
 * @memberof Core
 */
const handleDeviceSelectionChanges = (context: CoreContext, interruptDevice?: DeviceTyped) => {
    const { uiPromises, deviceList, sendCoreMessage } = context;
    // update list of devices in popup
    const promiseExists = uiPromises.exists(UI.RECEIVE_DEVICE);
    if (promiseExists && deviceList.isConnected()) {
        const list = deviceList.asArray();
        const isWebUsb = deviceList.transportType() === 'WebUsbTransport';

        if (list.length === 1 && !isWebUsb) {
            // there is only one device. use it
            // resolve uiPromise to looks like it's a user choice (see: handleMessage function)
            uiPromises.resolve({
                type: UI.RECEIVE_DEVICE,
                payload: { device: list[0] },
            });
        } else {
            // update device selection list view
            sendCoreMessage(
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
            closePopup(context);
            cleanup(context);
        }
    }
};

const initDeviceList = (context: CoreContext) => {
    const { deviceList, sendCoreMessage } = context;

    deviceList.on(DEVICE.CONNECT, device => {
        handleDeviceSelectionChanges(context);
        sendCoreMessage(createDeviceMessage(DEVICE.CONNECT, device));
    });

    deviceList.on(DEVICE.CONNECT_UNACQUIRED, device => {
        handleDeviceSelectionChanges(context);
        sendCoreMessage(createDeviceMessage(DEVICE.CONNECT_UNACQUIRED, device));
    });

    deviceList.on(DEVICE.DISCONNECT, device => {
        handleDeviceSelectionChanges(context);
        sendCoreMessage(createDeviceMessage(DEVICE.DISCONNECT, device));
    });

    deviceList.on(DEVICE.CHANGED, device => {
        sendCoreMessage(createDeviceMessage(DEVICE.CHANGED, device));
    });

    deviceList.on(TRANSPORT.START, transportType =>
        sendCoreMessage(createTransportMessage(TRANSPORT.START, transportType)),
    );

    deviceList.on(DEVICE.TRANSPORT_STATE_CHANGED, device => {
        postMessage(createDeviceMessage(DEVICE.TRANSPORT_STATE_CHANGED, device));
    });

    deviceList.on(TRANSPORT.ERROR, error => {
        _log.warn('TRANSPORT.ERROR', error);
        sendCoreMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
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
    private popupPromise = createPopupPromiseManager();
    private methodSynchronize = getSynchronize();
    private uiPromises = createUiPromiseManager(() =>
        startInteractionTimeout(this.getCoreContext()),
    );

    private overridePromise: Promise<void> | undefined;
    private waitForFirstMethod = createDeferred();

    private _interactionTimeout?: InteractionTimeout;
    private get interactionTimeout() {
        return this._interactionTimeout ?? throwError('Core not initialized: interactionTimeout');
    }

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
            uiPromises: this.uiPromises,
            popupPromise: this.popupPromise,
            interactionTimeout: this.interactionTimeout,
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
            getOverridePromise: () => {
                return this.overridePromise;
            },
            setOverridePromise: (promise: Promise<void>) => {
                this.overridePromise = promise;
            },
        };
    }

    handleMessage(message: CoreRequestMessage) {
        _log.debug('handleMessage', message);

        switch (message.type) {
            case POPUP.HANDSHAKE:
                this.popupPromise.resolve();
                break;
            case POPUP.CLOSED:
                this.popupPromise.clear();
                onPopupClosed(
                    this.getCoreContext(),
                    message.payload ? message.payload.error : null,
                );
                break;

            case TRANSPORT.DISABLE_WEBUSB:
                disableWebUSBTransport(this.getCoreContext());
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
                    createResponseMessage(message.id, true, this.getTransportInfo()),
                );
                break;

            // messages from UI (popup/modal...)
            case UI.RECEIVE_DEVICE:
            case UI.RECEIVE_CONFIRMATION:
            case UI.RECEIVE_PERMISSION:
            case UI.RECEIVE_PIN:
            case UI.RECEIVE_PASSPHRASE:
            case UI.INVALID_PASSPHRASE_ACTION:
            case UI.RECEIVE_THP_PAIRING_TAG:
            case UI.RECEIVE_ACCOUNT:
            case UI.RECEIVE_FEE:
            case UI.RECEIVE_WORD:
            case UI.LOGIN_CHALLENGE_RESPONSE:
                this.uiPromises.resolve(message);
                break;

            // message from index
            case IFRAME.CALL:
                // firmwareUpdate is the only procedure that expects device disconnecting
                // and reconnecting during the process. Due to this it can't be handled just
                // like regular methods using onCall function. In onCall, disconnecting device
                // means that call immediately returns error.
                if (message.payload.method === 'firmwareUpdate') {
                    assertDeviceListConnected(this.deviceList);
                    onCallFirmwareUpdate({
                        params: message.payload,
                        context: {
                            deviceList: this.deviceList,
                            postMessage: this.sendCoreMessage.bind(this),
                            initDevice: path => initDevice(this.getCoreContext(), path),
                            log: _log,
                            abortSignal: this.abortController.signal,
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

    getTransportInfo(): TransportInfo | undefined {
        if (this.deviceList.isConnected()) {
            return this.deviceList.getTransportInfo();
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
            await DataManager.load(settings);
            const { debug, priority, _sessionsBackgroundUrl } = DataManager.getSettings();
            const messages = DataManager.getProtobufMessages();

            enableLog(debug);

            // If we're not in popup mode, set the interaction timeout to 0 (= disabled)
            this._interactionTimeout = new InteractionTimeout(
                settings.popup ? settings.interactionTimeout : 0,
            );

            this._deviceList = new DeviceList({
                debug,
                messages,
                priority,
                _sessionsBackgroundUrl,
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
            DataManager.getSettings();

        try {
            this.deviceList.setTransports(transports);
        } catch (error) {
            _log.error('setTransports', error);
            this.sendCoreMessage(createTransportMessage(TRANSPORT.ERROR, { error }));
            throttlePromise.reject(error);
            throw error;
        }

        this.deviceList.init({ pendingTransportEvent, transportReconnect });

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

const disableWebUSBTransport = async ({ deviceList, sendCoreMessage }: CoreContext) => {
    if (!deviceList.isConnected()) return;
    if (deviceList.transportType() !== 'WebUsbTransport') return;
    // override settings
    const { transports, pendingTransportEvent, transportReconnect } = DataManager.getSettings();

    if (transports) {
        const transportStr = transports?.filter(transport => typeof transport !== 'object');
        if (transportStr.includes('WebUsbTransport')) {
            transports.splice(transports.indexOf('WebUsbTransport'), 1);
        }
        if (!transportStr.includes('BridgeTransport')) {
            transports!.unshift('BridgeTransport');
        }
    }

    try {
        // clean previous device list
        deviceList.cleanup();
        // and init with new settings, without webusb
        deviceList.setTransports(transports);
        // TODO possible issue with new init not replacing the old one???
        await deviceList.init({ pendingTransportEvent, transportReconnect });
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
