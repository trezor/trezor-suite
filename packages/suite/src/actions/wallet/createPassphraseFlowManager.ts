/* eslint-disable @typescript-eslint/no-use-before-define */
import { TrezorConnectService } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    getDeviceInstances,
    getNewInstanceNumber,
    getSelectedDevice,
    isDeviceAcquired,
} from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    createDiscoveryThunk,
    createInstance,
    deviceActions,
    selectDeviceThunk,
    selectDevices,
    selectIsDiscoveryAuthConfirmationRequired,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import TrezorConnect, { UI } from '@trezor/connect';

import { selectRouter } from 'src/reducers/suite/routerReducer';
import { DiscoveryHook, isDiscoveryHookHandledError } from 'src/support/discoveryHook';

import {
    PassphraseWalletState,
    finishPassphraseFlow,
    resetPassphraseFlow,
    setPassphraseFlowState,
    setPassphraseFlowTransactionLoading,
    startPassphraseFlow,
} from './passphraseFlowActions';
import { selectSuiteSettings } from '../../reducers/suite/suiteReducer';
import { selectPassphraseFlow } from '../../reducers/wallet/passphraseFlowSelectors';
import { Store } from '../../types/suite';
import { goto } from '../suite/routerActions';

const determineBackState = (state: PassphraseWalletState): PassphraseWalletState | null => {
    switch (state) {
        case 'not-exist-best-practices':
            return null;
        case 'not-exist-enter-passphrase':
            return 'not-exist-best-practices';
        case 'not-exist-confirm-passphrase':
            return 'not-exist-enter-passphrase';
        case 'exists-enter-passphrase':
            return 'initial';
        case 'not-exist-awaiting-discovery':
            return 'not-exist-enter-passphrase';
        case 'exists-empty-wallet':
            return 'exists-enter-passphrase';
        case 'exists-best-practices':
            return 'exists-empty-wallet';

        // Transition to 'initial' state
        case 'exists-awaiting-discovery':
        case 'exists-confirm-passphrase':
        case 'exists-passphrase-mismatch-warning':
        case 'not-exist-passphrase-mismatch-warning':
        case 'initial':
        case 'passphrase-duplicate':
            return null;

        default: {
            const _unhandledCase: never = state;
            throw new Error(`Unhandled state: ${_unhandledCase}`);
        }
    }
};

const STATE_CANCEL_MAP: Record<PassphraseWalletState, string | null> = {
    'not-exist-enter-passphrase': 'enter-passphrase-back',
    'not-exist-confirm-passphrase': 'confirm-passphrase-back',
    'exists-enter-passphrase': 'enter-passphrase-back',
    'exists-confirm-passphrase': 'confirm-passphrase-back',

    // Transition to 'initial' state
    'exists-awaiting-discovery': null,
    'exists-best-practices': null,
    'exists-empty-wallet': null,
    'exists-passphrase-mismatch-warning': null,
    'not-exist-best-practices': null,
    'not-exist-awaiting-discovery': null,
    'not-exist-passphrase-mismatch-warning': null,
    initial: null,
    'passphrase-duplicate': null,
};

const matchStateTransition = <
    TPreviousState extends PassphraseWalletState,
    TNextState extends PassphraseWalletState,
>(
    previousState: TPreviousState,
    newState: TNextState & (TNextState extends TPreviousState ? never : TNextState),
) => `${previousState}|${newState}`;

const createStateTransitionMatcher = <
    TPreviousState extends PassphraseWalletState,
    TNextState extends PassphraseWalletState,
>(
    previousState: TPreviousState,
    newState: TNextState,
) => `${previousState}|${newState}`;

const stateInStates = <A extends PassphraseWalletState>(toMatch: A, states: A[]) =>
    states.includes(toMatch);

type PassphraseFlowManageDependencies = {
    store: Store;
    trezorConnectService: TrezorConnectService;
    discoveryHook: DiscoveryHook;
};

export const createPassphraseFlowManager = ({
    store,
    trezorConnectService,
    discoveryHook,
}: PassphraseFlowManageDependencies) => {
    const { getState, dispatch } = store;

    const finishFlow = () => {
        dispatch(finishPassphraseFlow());
    };

    const cancelFlow = (options: { reason: string } = { reason: 'auth-confirm-cancel' }) => {
        if (options.reason !== 'auth-failed') {
            trezorConnectService.invoke(trezorConnect => trezorConnect.cancel(options.reason));
        }
    };

    const _invalidateAndForgetAddedDevice = (device: TrezorDevice) => {
        const settings = selectSuiteSettings(getState());

        dispatch(deviceActions.forgetDevice({ device, settings }));

        const newDevice = selectSelectedDevice(getState());
        dispatch(deviceActions.selectDevice(newDevice));
        discoveryHook.deregisterAuthHook(device);
    };

    const _requestPassphraseWalletCreation = async (
        device: TrezorDevice,
        deviceParams: Parameters<typeof TrezorConnect.getDeviceState>[0],
    ): Promise<
        | {
              result: 'success';
          }
        | {
              result: 'error';
              error:
                  | 'auth-failed'
                  | 'passphrase-duplicate'
                  | 'device-not-ready'
                  | 'enter-passphrase-cancel'
                  | 'enter-passphrase-back';
          }
    > => {
        const { deviceReadyPromise, responsePromise } = await trezorConnectService.invokeUIAction(
            trezorConnect => {
                const result = trezorConnect.getDeviceState(deviceParams);

                return result;
            },
        );

        deviceReadyPromise.then(() => {
            dispatch(setPassphraseFlowTransactionLoading({ loading: false }));
        });

        const response = await responsePromise;

        if (response.success) {
            const { state, _state } = response.payload;
            const s = state.split(':')[0];
            const devices = selectDevices(getState());
            const duplicate = devices?.find(
                d =>
                    d.state?.staticSessionId &&
                    d.state.staticSessionId.split(':')[0] === s &&
                    d.instance !== device.instance,
            );

            if (duplicate) {
                // Use the notificationsActions to show a notification instead of a modal
                dispatch(
                    notificationsActions.addToast({
                        type: 'auth-failed',
                        error: `Passphrase already exists for device ${device.label || 'Unknown'}`,
                    }),
                );

                dispatch(
                    deviceActions.deviceAuthorizationFailed({
                        error: 'passphrase-duplicate',
                        device,
                    }),
                );

                return {
                    result: 'error',
                    error: 'passphrase-duplicate',
                };
            }

            const freshDevice = getSelectedDevice(device, selectDevices(getState()));

            if (!freshDevice) {
                throw new Error('fresh-device-not-selected-before-update');
            }

            dispatch(
                deviceActions.updateDeviceState({
                    device: freshDevice,
                    state: _state,
                }),
            );

            const updatedDevice = getSelectedDevice(device, selectDevices(getState()));
            if (updatedDevice && updatedDevice.state?.staticSessionId) {
                dispatch(deviceActions.updateSelectedDevice(updatedDevice));
            }

            return {
                result: 'success',
            };
        }

        if (
            response.payload.error === 'enter-passphrase-cancel' ||
            response.payload.error === 'enter-passphrase-back'
        ) {
            return {
                result: 'error',
                error: response.payload.error,
            };
        }

        const knownErrors = ['Canceled', 'Method_Cancel', 'Failure_ActionCancelled'];

        if (!knownErrors.includes(String(response.payload.code))) {
            dispatch(
                notificationsActions.addToast({
                    type: 'auth-failed',
                    error: response.payload.error,
                }),
            );
        }

        dispatch(
            deviceActions.deviceAuthorizationFailed({
                error: 'auth-failed',
                device,
            }),
        );

        return {
            result: 'error',
            error:
                response.payload.code === 'Method_Cancel' ||
                response.payload.code === 'Failure_ActionCancelled'
                    ? 'enter-passphrase-cancel'
                    : 'auth-failed',
        };
    };

    const _processPassphraseWalletAddition = (
        device: TrezorDevice,
        options: {
            requestWalletCreation: boolean;
        } = {
            requestWalletCreation: false,
        },
    ) => {
        const addDeviceInstance = async () => {
            if (!device.features?.passphrase_protection) {
                const response = await trezorConnectService.invoke(trezorConnect =>
                    trezorConnect.applySettings({
                        device,
                        use_passphrase: true,
                    }),
                );

                if (!response.success) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'error',
                            error: response.payload.error,
                        }),
                    );

                    throw new Error('passphrase-enabling-cancelled');
                }

                dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
            }

            const devices = selectDevices(getState());

            const newDeviceInstance = createInstance({
                ...device,
                useEmptyPassphrase: false,
                instance: getNewInstanceNumber(devices, device),
            });
            dispatch(deviceActions.addDeviceInstance({ device: newDeviceInstance }));

            // NOTE: make sure that the device is selected and this triggers the discovery
            dispatch(selectDeviceThunk({ device: newDeviceInstance }));

            const isDeviceReady =
                newDeviceInstance.connected &&
                isDeviceAcquired(newDeviceInstance) &&
                // Should ignore device state serves as a variant to call "reauthorize" device. For example, in passphrase mode
                // mobile has a retry button which starts passphrase flow on the same device instance to override device state.
                !newDeviceInstance.state?.staticSessionId &&
                newDeviceInstance.mode === 'normal' &&
                newDeviceInstance.firmware !== 'required';

            if (!isDeviceReady) throw new Error('device-not-ready');

            const deviceParams = {
                device: {
                    path: newDeviceInstance.path,
                    instance: newDeviceInstance.instance,
                    state: undefined,
                },
                keepSession: true,
                useEmptyPassphrase: newDeviceInstance.useEmptyPassphrase,
            } as Parameters<typeof TrezorConnect.getDeviceState>[0];

            if (options.requestWalletCreation) {
                _requestPassphraseWalletCreation(newDeviceInstance, deviceParams);

                return {
                    deviceParams,
                    newDeviceInstance,
                };
            }

            return { newDeviceInstance, deviceParams };
        };

        const selectDeviceInstance = ({ device }: { device: TrezorDevice }) => {
            dispatch(
                deviceActions.updatePassphraseMode({
                    device,
                    hidden: true, // For passphrase wallet, hidden is true
                }),
            );
            dispatch(selectDeviceThunk({ device }));

            return selectSelectedDevice(getState());
        };

        const devices = selectDevices(getState());
        const instances = getDeviceInstances(device, devices);
        const hasAtLeastOneWallet = instances.find(d => d.state) !== undefined;

        if (hasAtLeastOneWallet) {
            return addDeviceInstance();
        }

        const deviceInstance = instances[0];
        if (!deviceInstance) {
            return null;
        }

        const nextSelectedDevice = selectDeviceInstance({ device: deviceInstance });

        if (!nextSelectedDevice) {
            throw new Error(
                'No device selected in passphraseFlowManager#_processPassphraseWalletAddition',
            );
        }

        return {
            deviceParams: {
                device: {
                    path: nextSelectedDevice.path,
                    instance: nextSelectedDevice.instance,
                    state: undefined,
                },
                keepSession: true,
                useEmptyPassphrase: nextSelectedDevice.useEmptyPassphrase,
            },
            newDeviceInstance: nextSelectedDevice,
        };
    };

    const _initEnterPassphrase = async (device: TrezorDevice, { keepDevice = false }) => {
        dispatch(setPassphraseFlowTransactionLoading({ loading: true }));
        const router = selectRouter(getState());
        if (router.route?.name !== 'suite-index') {
            // NOTE: the app must be suite-index, otherwise the discovery won't be able to start
            // the UI test rely on the route of the app being at the index
            dispatch(goto('suite-index'));
        }

        if (!keepDevice) {
            _invalidateAndForgetAddedDevice(device);
        }

        // NOTE: when a "physical" first device is "base" - we started the passphrase, we want to use the one that is passed not selected one, as these may differ
        const baseDevice = keepDevice ? device : selectSelectedDevice(getState());
        if (!baseDevice) {
            _resetFlow();
            console.warn(
                'No device selected, cannot initialize passphrase flow in passphraseFlowManager#_initEnterPassphrase',
            );

            return;
        }

        try {
            // First, get the device parameters using authorizeDevice
            const processResult = await _processPassphraseWalletAddition(baseDevice, {
                requestWalletCreation: false,
            });

            if (!processResult) {
                console.error('No params received from passphraseFlowManager#_initEnterPassphrase');

                return;
            }

            const { newDeviceInstance, deviceParams } = processResult;

            if (newDeviceInstance) {
                const response = await _requestPassphraseWalletCreation(
                    newDeviceInstance,
                    deviceParams,
                );

                if (response?.result === 'error') {
                    _invalidateAndForgetAddedDevice(newDeviceInstance);
                    const devices = selectDevices(getState());

                    // NOTE: it could happen that we didn't create a special device for the passphrase wallet
                    // hence we must pick a wallet to select from all devices
                    const deviceToSelect = [baseDevice, ...devices].find(device =>
                        Boolean(device.state),
                    );

                    dispatch(deviceActions.selectDevice(deviceToSelect ?? baseDevice));

                    switch (response.error) {
                        case 'auth-failed':
                        case 'enter-passphrase-cancel':
                            _resetFlow();
                            break;
                        case 'enter-passphrase-back':
                            // NOTE: this should be somehow handled
                            // like, we should open the device switch
                            // or delete the device
                            break;
                        case 'passphrase-duplicate':
                            transactState(baseDevice, 'passphrase-duplicate');
                            break;
                    }

                    return;
                }

                const freshDevice = selectSelectedDevice(getState());

                if (!freshDevice || !freshDevice.state?.staticSessionId) {
                    throw new Error('fresh-device-not-selected');
                }

                // NOTE: Register the hooks here to make sure that these are resolved.
                const completeDiscoverPromise =
                    discoveryHook.registerDiscoveryCompleteHook(newDeviceInstance);
                const authPromise = discoveryHook.registerDiscoveryAuthHook(newDeviceInstance);

                dispatch(
                    createDiscoveryThunk({
                        deviceState: freshDevice.state.staticSessionId,
                        device: freshDevice,
                        immediatlyStartDiscovery: true,
                    }),
                );

                transactState(freshDevice, 'not-exist-awaiting-discovery');

                try {
                    await Promise.race([completeDiscoverPromise, authPromise]);
                } catch (err) {
                    console.warn('passphraseFlowManager#_initEnterPassphrase', err);
                    cancelFlow({ reason: 'auth-failed' });
                    _invalidateAndForgetAddedDevice(freshDevice);
                    _resetFlow();

                    return;
                }
                const maybeUpdatedSelectedDevice = selectSelectedDevice(getState());
                const authConfirmation =
                    maybeUpdatedSelectedDevice &&
                    (selectIsDiscoveryAuthConfirmationRequired(getState()) ||
                        maybeUpdatedSelectedDevice?.authConfirm);

                if (authConfirmation) {
                    // NOTE: here we must wait for the whole process to end
                    try {
                        await completeDiscoverPromise;
                    } catch (err) {
                        if (isDiscoveryHookHandledError(err)) {
                            return;
                        }
                        throw err;
                    }

                    toPassphraseConfirmation(maybeUpdatedSelectedDevice);

                    return;
                }

                finishFlow();
            }
        } catch (error) {
            dispatch(setPassphraseFlowTransactionLoading({ loading: false }));
            console.error('Error during best practices confirmation:', error);
            cancelFlow({ reason: 'enter-passphrase-back' });
        }
    };

    const transactState = (
        device: TrezorDevice,
        state: PassphraseWalletState,
        options: { cancelReason: string | null } = { cancelReason: null },
    ) => {
        const flow = selectPassphraseFlow(getState());
        if (!flow) {
            console.warn('Now passphrase flow to restart, nothing will be done');

            return;
        }

        const prevState = flow.state;

        let maintainLoadingForState = false;

        switch (createStateTransitionMatcher(prevState, state)) {
            case matchStateTransition('not-exist-enter-passphrase', 'not-exist-best-practices'):
            case matchStateTransition('exists-empty-wallet', 'exists-enter-passphrase'):
                trezorConnectService.invoke(trezorConnect =>
                    trezorConnect.cancel(options.cancelReason ?? 'enter-passphrase-back'),
                );
                break;
        }

        switch (state) {
            // NOTE: anytime when we go to 'not-exist-enter-passphrase', we need to initialize the flow on the device.
            case 'not-exist-enter-passphrase':
            case 'exists-enter-passphrase':
                maintainLoadingForState = true;
                _initEnterPassphrase(device, {
                    // NOTE: we do not forget the device, only when we are coming to the state for the first time.
                    keepDevice: stateInStates(prevState, [
                        'exists-passphrase-mismatch-warning',
                        'not-exist-best-practices',
                        'initial',
                    ]),
                });
                break;

            case 'exists-confirm-passphrase':
                maintainLoadingForState = true;
                _initConfirmPassphrase(device);
                break;

            case 'initial':
                _resetFlow();
                break;
        }

        dispatch(
            setPassphraseFlowState({
                state,
                maintainLoadingForState,
            }),
        );
    };

    const goBack = (device: TrezorDevice) => {
        const flow = selectPassphraseFlow(getState());
        if (flow === null) return;

        const { state } = flow;

        const previousState = determineBackState(state);

        const cancelReason = STATE_CANCEL_MAP[state];

        if (cancelReason !== null) {
            trezorConnectService.invoke(trezorConnect => trezorConnect.cancel(cancelReason));
        }

        if (previousState !== null) {
            transactState(device, previousState, { cancelReason });

            return;
        }

        _resetFlow();
    };

    const confirmBestPractices = (device: TrezorDevice) => {
        const flow = selectPassphraseFlow(getState());

        if (flow === null) {
            console.warn('Best practices confirm called in invalid state');

            return;
        }

        transactState(
            device,
            flow.isExisting ? 'exists-confirm-passphrase' : 'not-exist-enter-passphrase',
        );
    };

    const startFlow = (device: TrezorDevice, { isExisting }: { isExisting: boolean }) => {
        const id = `passphrase-flow-${device.path}-${device.instance || 'unknown'}-${Date.now()}`;

        dispatch(
            startPassphraseFlow({
                id,
                isExisting,
            }),
        );

        dispatch(selectDeviceThunk({ device }));

        transactState(device, isExisting ? 'exists-enter-passphrase' : 'not-exist-best-practices');
    };

    const _resetFlow = () => {
        dispatch(setPassphraseFlowState({ state: 'initial', maintainLoadingForState: false }));

        // NOTE: hack - when the device flow is canceled when a device prompt is on,
        // there is a "confirm password" modal flicking in the background
        // because the passphrase flow state is deleted too fast.
        // So set first to "initial" which will render null and then remove it completely.
        setTimeout(() => {
            dispatch(resetPassphraseFlow());
        }, 2000);
    };

    const _initConfirmPassphrase = async (device: TrezorDevice) => {
        dispatch(setPassphraseFlowTransactionLoading({ loading: true }));

        try {
            const { responsePromise, deviceReadyPromise } =
                await trezorConnectService.invokeUIAction(trezorConnect =>
                    trezorConnect.getDeviceState({
                        device: {
                            path: device.path,
                            instance: device.instance,
                            state: undefined,
                        },
                        keepSession: false,
                    }),
                );

            deviceReadyPromise.then(() => {
                dispatch(setPassphraseFlowTransactionLoading({ loading: false }));
            });

            const response = await responsePromise;

            if (!response.success) {
                _invalidateAndForgetAddedDevice(device);

                if (response.payload.error === 'auth-confirm-retry') {
                    if (
                        response.payload.error === 'auth-confirm-retry' &&
                        device.type === 'acquired'
                    ) {
                        startFlow(device, { isExisting: false });

                        return;
                    }

                    return;
                }

                const devices = selectDevices(getState());

                // NOTE: it could happen that we didn't create a special device for the passphrase wallet
                // hence we must pick a wallet to select from all devices
                const deviceToSelect = devices.find(device => Boolean(device.state));

                if (deviceToSelect) {
                    dispatch(selectDeviceThunk({ device: deviceToSelect }));
                }

                const knownErrorCodes = ['Method_Cancel'];

                if (
                    response.payload.error === 'Canceled' ||
                    response.payload.error === 'auth-confirm-cancel' ||
                    response.payload.error === 'confirm-passphrase-back'
                ) {
                    _resetFlow();
                }

                if (!knownErrorCodes.includes(String(response.payload.code))) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'auth-confirm-error',
                            error: response.payload.error,
                        }),
                    );
                }

                return;
            }

            const nextFlow = selectPassphraseFlow(getState());
            if (!nextFlow) {
                console.warn(
                    'Passphrase flow not found in passphraseFlowManager#toPassphraseConfirmation',
                );

                return;
            }

            if (response.payload.state !== device.state?.staticSessionId) {
                dispatch(deviceActions.receiveAuthConfirm({ device, success: false }));
                _invalidateAndForgetAddedDevice(device);
                // NOTE: The selected device must have changed
                const selectedDevice = selectSelectedDevice(getState());
                if (selectedDevice) {
                    transactState(
                        selectedDevice,
                        nextFlow.isExisting
                            ? 'exists-passphrase-mismatch-warning'
                            : 'not-exist-passphrase-mismatch-warning',
                    );

                    return;
                }

                console.error(
                    'PassphraseFlowManager: No selected device found to restart the flow',
                );

                // NOTE: for some reason, there isn't any device selected
                _resetFlow();

                return;
            }

            dispatch(deviceActions.receiveAuthConfirm({ device, success: true }));

            finishFlow();
        } finally {
            dispatch(setPassphraseFlowTransactionLoading({ loading: false }));
        }
    };

    const toPassphraseConfirmation = (device: TrezorDevice) => {
        const flow = selectPassphraseFlow(getState());

        if (!flow) {
            console.warn('Confirm password called in invalid state');

            return;
        }

        // NOTE: we go to a different flow from here
        if (flow.isExisting) {
            transactState(device, 'exists-empty-wallet');

            return;
        }

        // NOTE: display THE Proper UI state where it is possible to enter the passphrase
        transactState(device, 'not-exist-confirm-passphrase');

        _initConfirmPassphrase(device);
    };

    const confirmPassphrase = (
        confirmedPassphrase: string,
        {
            passphraseOnDevice,
        }: {
            passphraseOnDevice: boolean;
        } = {
            passphraseOnDevice: false,
        },
    ) => {
        const flow = selectPassphraseFlow(getState());

        if (!flow) {
            console.warn('No passphrase flow in passphraseFlowManager#confirmPassphrase');

            return;
        }

        const selectedDevice = selectSelectedDevice(getState());

        if (!selectedDevice) {
            console.warn('No selected device in passphraseFlowManager#confirmPassphrase');

            return;
        }

        const alwaysOnDevice = Boolean(passphraseOnDevice);
        const hidden = Boolean(passphraseOnDevice || !!confirmedPassphrase);

        if (
            selectedDevice.passphraseOnDevice !== alwaysOnDevice ||
            selectedDevice.useEmptyPassphrase !== !hidden
        ) {
            dispatch(
                deviceActions.updatePassphraseMode({
                    device: selectedDevice,
                    hidden,
                    alwaysOnDevice,
                }),
            );
        }

        trezorConnectService.invoke(trezorConnect =>
            trezorConnect.uiResponse({
                type: UI.RECEIVE_PASSPHRASE,
                payload: {
                    value: confirmedPassphrase,
                    save: true,
                    passphraseOnDevice,
                },
            }),
        );
    };

    const submitPassphrase = (
        passphrase: string,
        options: { device: TrezorDevice; passphraseOnDevice?: boolean },
    ) => {
        const flow = selectPassphraseFlow(getState());
        if (!flow) {
            console.warn('No passphrase flow in passphraseFlowManager#submitPassphrase');

            return;
        }

        const selectedDevice = selectSelectedDevice(getState());

        const alwaysOnDevice = Boolean(options.passphraseOnDevice);
        const hidden = Boolean(options.passphraseOnDevice || !!passphrase);

        if (
            selectedDevice?.passphraseOnDevice !== Boolean(options.passphraseOnDevice) ||
            selectedDevice?.useEmptyPassphrase !== !hidden
        ) {
            dispatch(
                deviceActions.updatePassphraseMode({
                    device: options.device,
                    hidden,
                    alwaysOnDevice,
                }),
            );
        }

        trezorConnectService.invoke(trezorConnect =>
            trezorConnect.uiResponse({
                type: UI.RECEIVE_PASSPHRASE,
                payload: {
                    value: passphrase,
                    save: true,
                    passphraseOnDevice: options.passphraseOnDevice,
                },
            }),
        );
    };

    const toBestPractices = (device: TrezorDevice) => {
        const flow = selectPassphraseFlow(getState());
        if (!flow) return;

        transactState(
            device,
            flow.isExisting ? 'exists-best-practices' : 'not-exist-best-practices',
        );
    };

    const startOver = (device: TrezorDevice) => {
        const flow = selectPassphraseFlow(getState());
        if (!flow) {
            console.warn('Now passphrase flow to restart, nothing will be done');

            return;
        }

        transactState(
            device,
            flow.isExisting ? 'exists-enter-passphrase' : 'not-exist-enter-passphrase',
        );
    };

    return {
        startFlow,
        cancelFlow,
        goBack,
        startOver,
        toBestPractices,
        finishFlow,
        submitPassphrase,
        confirmPassphrase,
        confirmBestPractices,
        transactState,
    };
};

export type PassphraseFlowManager = ReturnType<typeof createPassphraseFlowManager>;
