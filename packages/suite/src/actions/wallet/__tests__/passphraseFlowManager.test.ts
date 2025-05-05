/* eslint-disable jest/no-mocks-import */
import { AnyAction } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore } from '@suite-common/test-utils';
import { deviceActions } from '@suite-common/wallet-core';
import { Discovery } from '@suite-common/wallet-types';
import { UI } from '@trezor/connect';

import { ROUTER } from 'src/actions/suite/constants';
import { AppState } from 'src/reducers/store';
import { TimeoutError } from 'src/support/discoveryHook';

import { createMockDiscoveryHook } from '../../../support/__mocks__/mockDiscoveryHook';
import {
    createDefaultMockDevice,
    createMockTrezorConnect,
    createMockTrezorConnectService,
} from '../../../support/__mocks__/mockTrezorConnectService';
import { createPassphraseFlowManager } from '../createPassphraseFlowManager';
import {
    finishPassphraseFlow,
    resetPassphraseFlow,
    setPassphraseFlowState,
    startPassphraseFlow,
} from '../passphraseFlowActions';

const createDispatchPromiseForTest = <A extends AnyAction>(
    onDispatch: (listener: (action: A) => void) => void,
    actionType: string,
    callback?: (action: A) => A | PromiseLike<A>,
) =>
    new Promise<A>(resolve => {
        onDispatch(action => {
            if (action.type === actionType) {
                if (callback) {
                    resolve(callback(action));

                    return;
                }
                resolve(action);
            }
        });
    });

const createFinishTestPromise = (): {
    finishPromise: Promise<void>;
    finishTestResolve: () => void;
} => {
    let finishTestResolve: () => void = () => {};

    const finishPromise = new Promise<void>(resolve => {
        finishTestResolve = resolve;
    });

    return { finishPromise, finishTestResolve };
};

const updateStateAction = (state: Partial<AppState>) => ({
    type: 'updateStateInTest',
    payload: state,
});

describe('passphraseFlowManager', () => {
    // Mock device for testing
    const mockDevice: TrezorDevice = createDefaultMockDevice();

    // Define initial state
    const getInitialState = (overrides = {}): AppState =>
        ({
            suite: {
                settings: {
                    debug: {},
                },
                locks: {},
            },
            device: {
                devices: [mockDevice],
                selectedDevice: mockDevice,
            },
            modal: {
                context: '@modal/context-none',
            },
            wallet: {
                passphraseFlow: null,
                settings: {
                    localCurrency: 'USD',
                    bitcoinAmountUnit: 0,
                    enabledNetworks: ['btc'],
                },
            },
            router: {
                app: 'wallet',
                route: {
                    name: 'wallet-index',
                },
                pathname: '/wallet',
                params: {},
                hash: '',
            },
            ...overrides,
        }) as unknown as AppState;

    type State = ReturnType<typeof getInitialState>;

    const initStore = ({
        state,
        customReducer,
    }: {
        state: State;
        customReducer?: (state: State, action: AnyAction) => State;
    }) => {
        const discoveryHook = createMockDiscoveryHook();
        const trezorConnnect = createMockTrezorConnect();
        const trezorConnectService = createMockTrezorConnectService(trezorConnnect);

        const store = configureMockStore<State, AnyAction>({
            extra: {
                services: {
                    discoveryHook,
                    trezorConnectService,
                },
                selectors: {
                    selectDevice: () => mockDevice,
                },
            },
            // @ts-expect-error: mocking is hard
            reducer: customReducer,
            preloadedState: state,
        });

        const manager = createPassphraseFlowManager({
            store,
            discoveryHook,
            trezorConnectService,
        });

        return {
            store,
            manager,
            trezorConnnect,
            discoveryHook,
            services: {
                trezorConnectService,
            },
        };
    };

    describe('_initEnterPassphrase keeping / selecting a next device', () => {
        it('should reset flow and warn if no device is selected (via confirmBestPractices)', () => {
            const prevMockSelectedDevice = createDefaultMockDevice({
                id: 'test-unconnected-device-id',
                connected: false,
                instance: 1,
                state: {
                    staticSessionId: 'blabla-1@asdf:1',
                },
            });

            const prevDeviceAnotherInstance = createDefaultMockDevice({
                ...prevMockSelectedDevice,
                instance: 2,
                // @ts-expect-error: mocking is hard
                state: {
                    staticSessionId: 'blabla-1@asdf:2',
                    sessionId: undefined,
                    deriveCardano: false,
                },
            });

            // Use a dummy device (will not be found in selectedDevice)
            const dummyDevice = createDefaultMockDevice({
                id: 'test-dummy-device-id-1',
                instance: 1,
                connected: true,
            });

            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-best-practices',
                        },
                        settings: {
                            localCurrency: 'USD',
                            bitcoinAmountUnit: 0,
                            enabledNetworks: ['btc'],
                        },
                    },
                    device: {
                        devices: [prevMockSelectedDevice, prevDeviceAnotherInstance, dummyDevice],
                        selectedDevice: prevDeviceAnotherInstance,
                    },
                }),
            });

            const resetFlowPromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.addDeviceInstance.type,
            ).then(action => {
                expect(action.payload.device.id).toEqual('test-dummy-device-id-1');
            });

            manager.confirmBestPractices(dummyDevice);

            return resetFlowPromise;
        });

        it("should pick a current wallet when there aren't any and turn it to the passphrase wallet while selecting the only wallet instance", () => {
            const prevMockSelectedDevice = createDefaultMockDevice({
                id: 'test-unconnected-device-id',
                connected: false,
                instance: 1,
                state: {
                    staticSessionId: 'blabla-1@asdf:1',
                },
            });

            const prevDeviceAnotherInstance = createDefaultMockDevice({
                ...prevMockSelectedDevice,
                instance: 2,
                // @ts-expect-error: mocking is hard
                state: {
                    staticSessionId: 'blabla-1@asdf:2',
                    sessionId: undefined,
                    deriveCardano: false,
                },
            });

            // Use a dummy device (will not be found in selectedDevice)
            const dummyDevice = createDefaultMockDevice({
                id: 'test-dummy-device-id-1',
                instance: 1,
                connected: true,
                useEmptyPassphrase: true,
            });

            const { manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-best-practices',
                        },
                        settings: {
                            localCurrency: 'USD',
                            bitcoinAmountUnit: 0,
                            enabledNetworks: ['btc'],
                        },
                    },
                    device: {
                        devices: [prevMockSelectedDevice, prevDeviceAnotherInstance, dummyDevice],
                        selectedDevice: prevDeviceAnotherInstance,
                    },
                }),

                customReducer: (state, action) => {
                    if (action.type === deviceActions.updatePassphraseMode.type) {
                        return {
                            ...state,
                            device: {
                                ...state.device,
                                devices: state.device.devices.map(candidate =>
                                    candidate === action.payload.device
                                        ? {
                                              ...candidate,
                                              useEmptyPassphrase: false,
                                          }
                                        : candidate,
                                ),
                            },
                        };
                    }

                    if (action.type === deviceActions.selectDevice.type) {
                        return {
                            ...state,
                            device: {
                                ...state.device,
                                selectedDevice: action.payload,
                            },
                        };
                    }

                    return state;
                },
            });

            const { finishPromise, finishTestResolve } = createFinishTestPromise();

            trezorConnnect.getDeviceState.mockImplementation(params => {
                expect(params?.useEmptyPassphrase).toEqual(false);

                finishTestResolve?.();

                return Promise.resolve({
                    success: true,
                    payload: {
                        state: 'device-state@test-123:2',
                        _state: {},
                    },
                    device: dummyDevice,
                });
            });

            manager.confirmBestPractices(dummyDevice);

            return finishPromise;
        });
    });

    it('should start the passphrase flow', () => {
        const { store, manager } = initStore({ state: getInitialState() });

        const passphraseFlowStartPromise = createDispatchPromiseForTest(
            store.onDispatch,
            startPassphraseFlow.type,
        ).then(action => {
            expect(action).toMatchObject({
                payload: {
                    isExisting: false,
                },
            });

            return action;
        });

        manager.startFlow(mockDevice, { isExisting: false });

        return passphraseFlowStartPromise;
    });

    it('should cancel the passphrase flow', () => {
        const { manager, trezorConnnect } = initStore({
            state: getInitialState({
                wallet: {
                    passphraseFlow: {
                        device: mockDevice,
                        isExisting: false,
                        state: 'not-exist-enter-passphrase',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
            }),
        });

        manager.cancelFlow();

        expect(trezorConnnect.cancel).toHaveBeenCalledWith('auth-confirm-cancel');
    });

    it('should finish the passphrase flow', () => {
        const { store, manager } = initStore({
            state: getInitialState({
                wallet: {
                    passphraseFlow: {
                        device: mockDevice,
                        isExisting: false,
                        state: 'not-exist-enter-passphrase',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
            }),
        });

        const flowFinishPromise = createDispatchPromiseForTest(
            store.onDispatch,
            finishPassphraseFlow.type,
        ).then(action => {
            expect(action).toEqual(finishPassphraseFlow());

            return action;
        });

        manager.finishFlow();

        return flowFinishPromise;
    });

    it('should submit passphrase', () => {
        const { manager, trezorConnnect } = initStore({
            state: getInitialState({
                wallet: {
                    passphraseFlow: {
                        device: mockDevice,
                        isExisting: false,
                        state: 'not-exist-enter-passphrase',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
            }),
        });

        manager.submitPassphrase('test-passphrase', { device: mockDevice });

        expect(trezorConnnect.uiResponse).toHaveBeenCalledWith({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value: 'test-passphrase',
                save: true,
                passphraseOnDevice: undefined,
            },
        });
    });

    it('should confirm passphrase', () => {
        const { manager, trezorConnnect } = initStore({
            state: getInitialState({
                wallet: {
                    passphraseFlow: {
                        device: mockDevice,
                        isExisting: false,
                        state: 'not-exist-confirm-passphrase',
                        passphrase: 'test-passphrase',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
            }),
        });

        manager.confirmPassphrase('test-passphrase');

        expect(trezorConnnect.uiResponse).toHaveBeenCalledWith({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value: 'test-passphrase',
                save: true,
                passphraseOnDevice: false,
            },
        });
    });

    describe('going back cases', () => {
        it('should handle going back from not-exist-confirm-passphrase', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-confirm-passphrase',
                        },
                    },
                }),
            });

            const passphraseFlowSetActionPromise = createDispatchPromiseForTest(
                store.onDispatch,
                setPassphraseFlowState.type,
            ).then(action => {
                expect(action).toEqual(
                    setPassphraseFlowState({
                        state: 'not-exist-enter-passphrase',
                        maintainLoadingForState: true,
                    }),
                );

                return action;
            });

            manager.goBack(mockDevice);

            return passphraseFlowSetActionPromise;
        });

        it('should handle going back from not-exist-enter-passphrase', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                }),
            });

            const passphraseFlowSetActionPromise = createDispatchPromiseForTest(
                store.onDispatch,
                setPassphraseFlowState.type,
            ).then(action => {
                expect(action).toEqual(
                    setPassphraseFlowState({
                        state: 'not-exist-best-practices',
                        maintainLoadingForState: false,
                    }),
                );

                return action;
            });

            manager.goBack(mockDevice);

            return passphraseFlowSetActionPromise;
        });

        it('should handle going back from not-exist-awaiting-discovery', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-awaiting-discovery',
                        },
                    },
                }),
            });

            const passphraseFlowSetActionPromise = createDispatchPromiseForTest(
                store.onDispatch,
                setPassphraseFlowState.type,
            ).then(action => {
                expect(action).toEqual(
                    setPassphraseFlowState({
                        state: 'not-exist-enter-passphrase',
                        maintainLoadingForState: true,
                    }),
                );

                return action;
            });

            manager.goBack(mockDevice);

            return passphraseFlowSetActionPromise;
        });

        it('should handle going back from exists-enter-passphrase', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: true,
                            state: 'exists-enter-passphrase',
                        },
                    },
                }),
            });

            const passphraseFlowSetActionPromise = createDispatchPromiseForTest(
                store.onDispatch,
                setPassphraseFlowState.type,
            ).then(action => {
                expect(action).toEqual(
                    setPassphraseFlowState({
                        state: 'initial',
                        maintainLoadingForState: false,
                    }),
                );

                return action;
            });

            manager.goBack(mockDevice);

            return passphraseFlowSetActionPromise;
        });

        it('should handle going back from exists-empty-wallet', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: true,
                            state: 'exists-empty-wallet',
                        },
                    },
                }),
            });

            const passphraseFlowSetActionPromise = createDispatchPromiseForTest(
                store.onDispatch,
                setPassphraseFlowState.type,
            ).then(action => {
                expect(action).toEqual(
                    setPassphraseFlowState({
                        state: 'exists-enter-passphrase',
                        maintainLoadingForState: true,
                    }),
                );

                return action;
            });

            manager.goBack(mockDevice);

            return passphraseFlowSetActionPromise;
        });

        it('should handle going back from exists-best-practices', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: true,
                            state: 'exists-best-practices',
                        },
                    },
                }),
            });

            const passphraseFlowSetActionPromise = createDispatchPromiseForTest(
                store.onDispatch,
                setPassphraseFlowState.type,
            ).then(action => {
                expect(action).toEqual(
                    setPassphraseFlowState({
                        state: 'exists-empty-wallet',
                        maintainLoadingForState: false,
                    }),
                );

                return action;
            });

            manager.goBack(mockDevice);

            return passphraseFlowSetActionPromise;
        });

        it('should handle going back by resetting from not-exist-best-practices with null back state', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-best-practices',
                        },
                    },
                }),
            });

            const passphraseFlowSetActionPromise = new Promise<void>((resolve, reject) => {
                store.onDispatch(action => {
                    if (action.type === resetPassphraseFlow.type) {
                        reject(new Error('No state change should occur'));
                    }
                });

                setTimeout(() => {
                    resolve();
                }, 100);

                manager.goBack(mockDevice);
            });

            return passphraseFlowSetActionPromise;
        });
    });

    it('should confirm best practices', () => {
        const { store, manager } = initStore({
            state: getInitialState({
                wallet: {
                    passphraseFlow: {
                        device: mockDevice,
                        isExisting: false,
                        state: 'not-exist-best-practices',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
            }),
        });

        const passphraseFlowSetActionPromise = createDispatchPromiseForTest(
            store.onDispatch,
            setPassphraseFlowState.type,
        ).then(action => {
            expect(action).toEqual(
                setPassphraseFlowState({
                    state: 'not-exist-enter-passphrase',
                    maintainLoadingForState: true,
                }),
            );

            return action;
        });

        manager.confirmBestPractices(mockDevice);

        return passphraseFlowSetActionPromise;
    });

    describe('happy path - not empty wallet', () => {
        it("should finish the passphrase flow for the case when the passphrase wallet isn't empty", async () => {
            // Prepare the initial state with a device in the initial flow state
            const { store, manager, trezorConnnect } = initStore({
                state: getInitialState({
                    router: {
                        route: {
                            name: 'suite-index',
                        },
                    },
                    wallet: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                        discovery: [],
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-best-practices',
                        },
                        settings: {
                            localCurrency: 'USD',
                            bitcoinAmountUnit: 0,
                            enabledNetworks: ['btc'],
                        },
                    },
                }),
                customReducer: (state: State, action: AnyAction) => {
                    if (action.type === 'updateStateInTest') {
                        return {
                            ...state,
                            ...action.payload,
                        };
                    }

                    return state;
                },
            });

            const newMockDeviceInstance = createDefaultMockDevice({
                instance: 2,
            });

            store.onDispatch(action => {
                if (action.type === deviceActions.addDeviceInstance.type) {
                    store.dispatch(
                        updateStateAction({
                            device: {
                                ...store.getState().device,
                                devices: [
                                    ...store.getState().device.devices,
                                    newMockDeviceInstance,
                                ],
                            },
                        }),
                    );
                }
            });

            trezorConnnect.getDeviceState.mockImplementation(params => {
                expect(params).toEqual({
                    device: { path: '1/3/3', instance: 2, state: undefined },
                    keepSession: true,
                    useEmptyPassphrase: false,
                });

                return Promise.resolve({
                    success: true,
                    payload: {
                        state: 'device-state@test-123:2',
                        _state: {},
                    },
                    device: mockDevice,
                });
            });

            manager.confirmBestPractices(mockDevice);

            await createDispatchPromiseForTest(store.onDispatch, finishPassphraseFlow.type);
        });

        it('should dispatch goto to the suite-index when best practices are confirmed when not on the wallet url', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    router: {
                        route: {
                            name: 'random-other-url',
                        },
                    },
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-best-practices',
                        },
                        settings: {
                            localCurrency: 'USD',
                            bitcoinAmountUnit: 0,
                            enabledNetworks: ['btc'],
                        },
                    },
                }),
            });

            const newMockDeviceInstance = createDefaultMockDevice({
                instance: 2,
            });

            store.onDispatch(action => {
                if (action.type === deviceActions.addDeviceInstance.type) {
                    store.dispatch(
                        updateStateAction({
                            device: {
                                ...store.getState().device,
                                devices: [
                                    ...store.getState().device.devices,
                                    newMockDeviceInstance,
                                ],
                            },
                        }),
                    );
                }
            });

            const locationChangePromise = createDispatchPromiseForTest(
                store.onDispatch,
                ROUTER.LOCATION_CHANGE,
            ).then(action => {
                expect(action.payload.route.name).toBe('suite-index');
            });

            manager.confirmBestPractices(mockDevice);

            return locationChangePromise;
        });
    });

    it('should dispatch authorizeDeviceThunkRejected when wallet is a duplicate of an existing wallet', () => {
        const mockDuplicateDevice = createDefaultMockDevice({
            instance: 2,
            state: {
                staticSessionId: 'device-duplicate-state@test-123:2',
            },
        });
        const { store, manager, trezorConnnect } = initStore({
            state: getInitialState({
                router: {
                    route: {
                        name: 'random-other-url',
                    },
                },
                wallet: {
                    passphraseFlow: {
                        device: mockDuplicateDevice,
                        isExisting: false,
                        state: 'not-exist-best-practices',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
                device: {
                    devices: [mockDuplicateDevice],
                    selectedDevice: mockDuplicateDevice,
                },
            }),
        });

        const newMockDeviceInstance = createDefaultMockDevice({
            instance: 2,
            state: {
                staticSessionId: 'device-duplicate-state@test-123:2',
            },
        });

        store.onDispatch(action => {
            if (action.type === deviceActions.addDeviceInstance.type) {
                store.dispatch(
                    updateStateAction({
                        device: {
                            ...store.getState().device,
                            devices: [...store.getState().device.devices, newMockDeviceInstance],
                        },
                    }),
                );
            }
        });

        trezorConnnect.getDeviceState.mockImplementation(() =>
            Promise.resolve({
                success: true,
                payload: {
                    state: 'device-duplicate-state@test-123:2',
                    _state: {},
                },
                device: mockDevice,
            }),
        );

        const deviceRejectedThunk = createDispatchPromiseForTest(
            store.onDispatch,
            deviceActions.deviceAuthorizationFailed.type,
        ).then(action => {
            expect(action.payload.error).toBe('passphrase-duplicate');
        });

        manager.confirmBestPractices(mockDevice);

        return deviceRejectedThunk;
    });

    it('should dispatch device state update when wallet is a duplicate of an existing wallet', () => {
        const mockBaseDevice = createDefaultMockDevice({
            instance: 2,
            state: undefined,
        });
        const { store, manager, trezorConnnect } = initStore({
            state: getInitialState({
                router: {
                    route: {
                        name: 'random-other-url',
                    },
                },
                wallet: {
                    passphraseFlow: {
                        device: mockBaseDevice,
                        isExisting: false,
                        state: 'not-exist-best-practices',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
                device: {
                    devices: [mockBaseDevice],
                    selectedDevice: mockBaseDevice,
                },
            }),
        });

        const newMockDeviceInstance = createDefaultMockDevice({
            instance: 2,
            state: {
                staticSessionId: 'device-other-state@test-123:2',
            },
        });

        store.onDispatch(action => {
            if (action.type === deviceActions.addDeviceInstance.type) {
                store.dispatch(
                    updateStateAction({
                        device: {
                            ...store.getState().device,
                            devices: [...store.getState().device.devices, newMockDeviceInstance],
                        },
                    }),
                );
            }
        });

        trezorConnnect.getDeviceState.mockImplementation(() =>
            Promise.resolve({
                success: true,
                payload: {
                    state: 'device-other-state@test-123:2' as const,
                    _state: {
                        staticSessionId: 'device-other-state@test-123:2' as const,
                    },
                },
                device: mockDevice,
            }),
        );

        const deviceStateUpdatePromise = createDispatchPromiseForTest(
            store.onDispatch,
            deviceActions.updateDeviceState.type,
        ).then(action => {
            expect(action.payload.state.staticSessionId).toBe('device-other-state@test-123:2');
        });

        manager.confirmBestPractices(mockDevice);

        return deviceStateUpdatePromise;
    });

    it('should dispatch update to the selected device when device is properly new', () => {
        const mockBaseDevice = createDefaultMockDevice({
            instance: 2,
            state: undefined,
        });
        const { store, manager, trezorConnnect } = initStore({
            state: getInitialState({
                router: {
                    route: {
                        name: 'random-other-url',
                    },
                },
                wallet: {
                    passphraseFlow: {
                        device: mockBaseDevice,
                        isExisting: false,
                        state: 'not-exist-best-practices',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
                device: {
                    devices: [mockBaseDevice],
                    selectedDevice: mockBaseDevice,
                },
            }),
            customReducer: (state: State, action: AnyAction) => {
                if (action.type === 'updateStateInTest') {
                    return {
                        ...state,
                        ...action.payload,
                    };
                }

                return state;
            },
        });

        const newMockDeviceInstance = createDefaultMockDevice({
            instance: 2,
            state: {
                staticSessionId: 'device-other-state@test-123:2',
            },
        });

        store.onDispatch(action => {
            if (action.type === deviceActions.addDeviceInstance.type) {
                store.dispatch(
                    updateStateAction({
                        device: {
                            ...store.getState().device,
                            devices: [...store.getState().device.devices, newMockDeviceInstance],
                        },
                    }),
                );
            }

            if (action.type === deviceActions.updateDeviceState.type) {
                store.dispatch(
                    updateStateAction({
                        device: {
                            ...store.getState().device,
                            devices: store.getState().device.devices.map(d =>
                                d.id === action.payload.device.id
                                    ? {
                                          ...d,
                                          state: action.payload.state,
                                      }
                                    : d,
                            ),
                            selectedDevice: (() => {
                                if (
                                    store.getState().device.selectedDevice?.id ===
                                    action.payload.device.id
                                ) {
                                    return {
                                        ...store.getState().device.selectedDevice,
                                        state: action.payload.state,
                                    } as TrezorDevice;
                                }

                                return store.getState().device.selectedDevice;
                            })(),
                        },
                    }),
                );
            }
        });

        trezorConnnect.getDeviceState.mockImplementation(() =>
            Promise.resolve({
                success: true,
                payload: {
                    state: 'device-other-state@test-123:2' as const,
                    _state: {
                        staticSessionId: 'device-other-state@test-123:2' as const,
                    },
                },
                device: mockDevice,
            }),
        );

        const deviceStateUpdatePromise = createDispatchPromiseForTest(
            store.onDispatch,
            deviceActions.updateSelectedDevice.type,
        ).then(action => {
            expect(action.payload.state.staticSessionId).toBe('device-other-state@test-123:2');
        });

        manager.confirmBestPractices(mockDevice);

        return deviceStateUpdatePromise;
    });

    describe('getDeviceState fails', () => {
        it('should forget and invalidate device when getDeviceState returns { success: false }', async () => {
            const mockDevice = {
                path: 'mock-device-path',
                features: {
                    passphrase_protection: false,
                },
            } as TrezorDevice;

            // Mock the trezorConnectService to simulate getDeviceState failure
            const { store, manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: false,
                            state: 'not-exist-enter-passphrase' as const,
                        },
                    },
                }),
            });

            // Spy on services to simulate { success: false } response
            jest.spyOn(trezorConnnect, 'getDeviceState').mockResolvedValue({
                success: false,
                payload: {
                    error: 'Device state retrieval failed',
                },
            });

            const forgetDevicePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.forgetDevice.type,
            ).then(action => {
                expect(action.payload.device).toEqual(mockDevice);
            });

            await manager.transactState(mockDevice, 'not-exist-enter-passphrase' as const);

            return forgetDevicePromise;
        });

        it('should pick a device to select from a valid selected devices when getDevieState fails { success: false }', () => {
            const mockDevice = createDefaultMockDevice({
                id: 'mock-device-to-create',
                state: undefined,
            });

            const deviceWallet1 = createDefaultMockDevice({
                id: 'mock-device-instance',
                instance: 1,
                state: {
                    staticSessionId: 'blabla-1@asdf:2',
                    sessionId: undefined,
                    deriveCardano: false,
                },
            });

            const deviceWallet2 = createDefaultMockDevice({
                id: 'mock-device-instance',
                instance: 2,
                state: {
                    staticSessionId: 'blabla-1@asdf:2',
                    sessionId: undefined,
                    deriveCardano: false,
                },
            });

            // Mock the trezorConnectService to simulate getDeviceState failure
            const { store, manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: false,
                            state: 'not-exist-enter-passphrase' as const,
                        },
                    },
                    device: {
                        selectedDevice: mockDevice,
                        devices: [mockDevice, deviceWallet1, deviceWallet2],
                    },
                }),
            });

            // Spy on services to simulate { success: false } response
            jest.spyOn(trezorConnnect, 'getDeviceState').mockResolvedValue({
                success: false,
                payload: {
                    error: 'Device state retrieval failed',
                },
            });

            const { finishPromise, finishTestResolve } = createFinishTestPromise();
            store.onDispatch(action => {
                if (
                    action.type === deviceActions.selectDevice.type &&
                    action.payload.id === deviceWallet1.id
                ) {
                    finishTestResolve();
                }
            });

            manager.transactState(mockDevice, 'not-exist-enter-passphrase' as const);

            return finishPromise;
        });
    });

    describe('passphraseFlowManager.transactState', () => {
        it('should not forget device when previous state is exists-passphrase-mismatch-warning', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: true,
                            state: 'exists-passphrase-mismatch-warning',
                        },
                    },
                }),
            });

            const forgetDevicePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.forgetDevice.type,
            );

            manager.transactState(mockDevice, 'exists-enter-passphrase');

            const timeoutPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            return Promise.race([forgetDevicePromise, timeoutPromise]);
        });

        it('should not forget device when previous state is not-exist-best-practices', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: false,
                            state: 'not-exist-best-practices',
                        },
                    },
                }),
            });

            const forgetDevicePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.forgetDevice.type,
            );

            manager.transactState(mockDevice, 'not-exist-enter-passphrase');

            const timeoutPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            return Promise.race([forgetDevicePromise, timeoutPromise]);
        });

        it('should not forget device when previous state is initial', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: false,
                            state: 'initial',
                        },
                    },
                }),
            });

            const forgetDevicePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.forgetDevice.type,
            );

            manager.transactState(mockDevice, 'not-exist-enter-passphrase');

            const timeoutPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            return Promise.race([forgetDevicePromise, timeoutPromise]);
        });

        it('should forget device for states not in the keepDevice list', () => {
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: false,
                            state: 'not-exist-confirm-passphrase',
                        },
                    },
                }),
            });

            const forgetDevicePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.forgetDevice.type,
            ).then(action => {
                expect(action.payload.device).toEqual(mockDevice);
            });

            manager.transactState(mockDevice, 'not-exist-enter-passphrase');

            return forgetDevicePromise;
        });

        it('should reset flow and forget device when getDeviceState fails with auth-confirm-cancel in exists-confirm-passphrase state', () => {
            const mockDevice = createDefaultMockDevice({
                instance: 2,
            });

            const { store, manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: true,
                            state: 'exists-confirm-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            // Spy on services to simulate { success: false } response
            jest.spyOn(trezorConnnect, 'getDeviceState').mockResolvedValue({
                success: false,
                payload: {
                    error: 'auth-confirm-cancel',
                },
            });

            const resetFlowPromise = createDispatchPromiseForTest(
                store.onDispatch,
                resetPassphraseFlow.type,
            );

            manager.transactState(mockDevice, 'exists-confirm-passphrase');

            return resetFlowPromise;
        });

        it('should forget the device when the passphrase confirmation fails', () => {
            const mockDevice = createDefaultMockDevice({
                instance: 2,
            });

            const { store, manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            isExisting: true,
                            state: 'exists-confirm-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            // Spy on services to simulate { success: false } response
            jest.spyOn(trezorConnnect, 'getDeviceState').mockResolvedValue({
                success: false,
                payload: {
                    error: 'auth-confirm-cancel',
                },
            });

            const forgetDevicePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.forgetDevice.type,
            ).then(action => {
                expect(action.payload.device).toEqual(mockDevice);
            });

            manager.transactState(mockDevice, 'exists-confirm-passphrase');

            return forgetDevicePromise;
        });
    });

    describe('passphraseFlowManager.goBack', () => {
        it('should call trezor.cancel with enter-passphrase-back when in not-exist-enter-passphrase state', () => {
            const expectedCancelKey = 'enter-passphrase-back';

            const { manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                }),
            });

            const cancelSpy = jest.spyOn(trezorConnnect, 'cancel');

            manager.goBack(mockDevice);

            expect(cancelSpy).toHaveBeenCalledWith(expectedCancelKey);
        });

        it('should call trezor.cancel with confirm-passphrase-back when in not-exist-confirm-passphrase state', async () => {
            const expectedCancelKey = 'confirm-passphrase-back';

            const { manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-confirm-passphrase',
                        },
                    },
                }),
            });

            const cancelSpy = jest.spyOn(trezorConnnect, 'cancel');

            await Promise.resolve(manager.goBack(mockDevice));

            expect(cancelSpy).toHaveBeenCalledWith(expectedCancelKey);
        });

        it('should call trezor.cancel with enter-passphrase-back when in exists-enter-passphrase state', async () => {
            const expectedCancelKey = 'enter-passphrase-back';

            const { manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: true,
                            state: 'exists-enter-passphrase',
                        },
                    },
                }),
            });

            const cancelSpy = jest.spyOn(trezorConnnect, 'cancel');
            await Promise.resolve(manager.goBack(mockDevice));

            expect(cancelSpy).toHaveBeenCalledWith(expectedCancelKey);
        });

        it('should call trezor.cancel with confirm-passphrase-back when in exists-confirm-passphrase state', async () => {
            const expectedCancelKey = 'confirm-passphrase-back';

            const { manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: true,
                            state: 'exists-confirm-passphrase',
                        },
                    },
                }),
            });

            const cancelSpy = jest.spyOn(trezorConnnect, 'cancel');

            await Promise.resolve(manager.goBack(mockDevice));

            expect(cancelSpy).toHaveBeenCalledWith(expectedCancelKey);
        });

        it('should do nothing if the current state does not have a corresponding cancel key', () => {
            const { manager, trezorConnnect } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-best-practices',
                        },
                    },
                }),
            });

            const cancelSpy = jest.spyOn(trezorConnnect, 'cancel');

            manager.goBack(mockDevice);

            expect(cancelSpy).not.toHaveBeenCalled();
        });
    });

    describe('submitPassphrase mode update logic', () => {
        const createMockDeviceWithPassphraseMode = (
            passphraseOnDevice = false,
            useEmptyPassphrase = true,
        ): TrezorDevice => ({
            ...createDefaultMockDevice(),
            passphraseOnDevice,
            useEmptyPassphrase,
        });

        it('should dispatch updatePassphraseMode when passphraseOnDevice changes', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, true);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            ).then(action => {
                expect(action.payload).toEqual({
                    device: expect.objectContaining({
                        passphraseOnDevice: false,
                        useEmptyPassphrase: true,
                    }),
                    hidden: true,
                    alwaysOnDevice: true,
                });

                return action;
            });

            manager.submitPassphrase('', {
                device: mockDevice,
                passphraseOnDevice: true,
            });

            return updatePassphraseModePromise;
        });

        it('should dispatch updatePassphraseMode when useEmptyPassphrase changes', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, true);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            ).then(action => {
                expect(action.payload).toEqual({
                    device: expect.objectContaining({
                        passphraseOnDevice: false,
                        useEmptyPassphrase: true,
                    }),
                    hidden: true,
                    alwaysOnDevice: false,
                });

                return action;
            });

            manager.submitPassphrase('test-passphrase', {
                device: mockDevice,
                passphraseOnDevice: false,
            });

            return updatePassphraseModePromise;
        });

        it('should NOT dispatch updatePassphraseMode when no changes are needed', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, false);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            );

            manager.submitPassphrase('some password', {
                device: mockDevice,
                passphraseOnDevice: false,
            });

            const timeoutPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            return Promise.race([updatePassphraseModePromise, timeoutPromise]);
        });

        it('should NOT dispatch updatePassphraseMode when all parameters are identical', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, false);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            );

            manager.submitPassphrase('', {
                device: mockDevice,
                passphraseOnDevice: false,
            });

            const timeoutPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            return Promise.race([updatePassphraseModePromise, timeoutPromise]);
        });
    });

    describe('confirmPassphrase mode update logic', () => {
        const createMockDeviceWithPassphraseMode = (
            passphraseOnDevice = false,
            useEmptyPassphrase = true,
        ): TrezorDevice => ({
            ...createDefaultMockDevice(),
            passphraseOnDevice,
            useEmptyPassphrase,
        });

        it('should dispatch updatePassphraseMode when passphraseOnDevice changes', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, true);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            ).then(action => {
                expect(action.payload).toEqual({
                    device: expect.objectContaining({
                        passphraseOnDevice: false,
                        useEmptyPassphrase: true,
                    }),
                    hidden: true,
                    alwaysOnDevice: true,
                });

                return action;
            });

            manager.confirmPassphrase('', {
                passphraseOnDevice: true,
            });

            return updatePassphraseModePromise;
        });

        it('should dispatch updatePassphraseMode when useEmptyPassphrase changes', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, true);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            ).then(action => {
                expect(action.payload).toEqual({
                    device: expect.objectContaining({
                        passphraseOnDevice: false,
                        useEmptyPassphrase: true,
                    }),
                    hidden: true,
                    alwaysOnDevice: false,
                });

                return action;
            });

            manager.confirmPassphrase('test-passphrase', {
                passphraseOnDevice: false,
            });

            return updatePassphraseModePromise;
        });

        it('should NOT dispatch updatePassphraseMode when no changes are needed', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, false);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            );

            manager.confirmPassphrase('', {
                passphraseOnDevice: false,
            });

            const timeoutPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            return Promise.race([updatePassphraseModePromise, timeoutPromise]);
        });

        it('should NOT dispatch updatePassphraseMode when all parameters are identical', () => {
            const mockDevice = createMockDeviceWithPassphraseMode(false, false);
            const { store, manager } = initStore({
                state: getInitialState({
                    wallet: {
                        passphraseFlow: {
                            device: mockDevice,
                            isExisting: false,
                            state: 'not-exist-enter-passphrase',
                        },
                    },
                    device: {
                        devices: [mockDevice],
                        selectedDevice: mockDevice,
                    },
                }),
            });

            const updatePassphraseModePromise = createDispatchPromiseForTest(
                store.onDispatch,
                deviceActions.updatePassphraseMode.type,
            );

            manager.confirmPassphrase('', {
                passphraseOnDevice: false,
            });

            const timeoutPromise = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));

            return Promise.race([updatePassphraseModePromise, timeoutPromise]);
        });
    });

    it('should handle the discovery hook timeout error by forgetting an existing device', async () => {
        const { store, manager, discoveryHook } = initStore({
            state: getInitialState({
                router: {
                    route: {
                        name: 'suite-index',
                    },
                },
                wallet: {
                    devices: [mockDevice],
                    selectedDevice: mockDevice,
                    discovery: [],
                    passphraseFlow: {
                        device: mockDevice,
                        isExisting: false,
                        state: 'not-exist-best-practices',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
            }),
            customReducer: (state: State, action: AnyAction) => {
                if (action.type === 'updateStateInTest') {
                    return {
                        ...state,
                        ...action.payload,
                    };
                }

                return state;
            },
        });

        const newMockDeviceInstance = createDefaultMockDevice({
            instance: 2,
        });

        store.onDispatch(action => {
            if (action.type === deviceActions.addDeviceInstance.type) {
                store.dispatch(
                    updateStateAction({
                        device: {
                            ...store.getState().device,
                            devices: [...store.getState().device.devices, newMockDeviceInstance],
                        },
                    }),
                );
            }

            if (action.type === deviceActions.selectDevice.type) {
                store.dispatch(
                    updateStateAction({
                        device: {
                            ...store.getState().device,
                            selectedDevice: newMockDeviceInstance,
                        },
                    }),
                );
            }
        });

        const resetFlowPromise = createDispatchPromiseForTest(
            store.onDispatch,
            deviceActions.forgetDevice.type,
        ).then(action => {
            expect(action.payload.device).toEqual(newMockDeviceInstance);

            return action;
        });

        jest.spyOn(discoveryHook, 'registerDiscoveryAuthHook').mockRejectedValue(
            new TimeoutError(),
        );
        jest.spyOn(discoveryHook, 'registerDiscoveryCompleteHook').mockReturnValue(
            new Promise<{ state: Discovery['deviceState']; device: TrezorDevice }>(resolve => {
                setTimeout(
                    () =>
                        resolve({
                            state: 'state@device-id:1' as const,
                            device: mockDevice,
                        }),
                    50000,
                );
            }),
        );

        manager.confirmBestPractices(mockDevice);

        await resetFlowPromise;
    });

    it('should handle the discovery hook timeout error by resetting the passphrase flow', async () => {
        const { store, manager, discoveryHook } = initStore({
            state: getInitialState({
                router: {
                    route: {
                        name: 'suite-index',
                    },
                },
                wallet: {
                    devices: [mockDevice],
                    selectedDevice: mockDevice,
                    discovery: [],
                    passphraseFlow: {
                        device: mockDevice,
                        isExisting: false,
                        state: 'not-exist-best-practices',
                    },
                    settings: {
                        localCurrency: 'USD',
                        bitcoinAmountUnit: 0,
                        enabledNetworks: ['btc'],
                    },
                },
            }),
            customReducer: (state: State, action: AnyAction) => {
                if (action.type === 'updateStateInTest') {
                    return {
                        ...state,
                        ...action.payload,
                    };
                }

                return state;
            },
        });

        const newMockDeviceInstance = createDefaultMockDevice({
            instance: 2,
        });

        store.onDispatch(action => {
            if (action.type === deviceActions.addDeviceInstance.type) {
                store.dispatch(
                    updateStateAction({
                        device: {
                            ...store.getState().device,
                            devices: [...store.getState().device.devices, newMockDeviceInstance],
                        },
                    }),
                );
            }
        });

        const resetFlowPromise = createDispatchPromiseForTest(
            store.onDispatch,
            resetPassphraseFlow.type,
        ).then(action => {
            expect(action.type).toBe(resetPassphraseFlow.type);

            return action;
        });

        jest.spyOn(discoveryHook, 'registerDiscoveryAuthHook').mockRejectedValue(
            new TimeoutError(),
        );
        jest.spyOn(discoveryHook, 'registerDiscoveryCompleteHook').mockReturnValue(
            new Promise<{ state: Discovery['deviceState']; device: TrezorDevice }>(resolve => {
                setTimeout(
                    () =>
                        resolve({
                            state: 'state@device-id:1' as const,
                            device: mockDevice,
                        }),
                    50000,
                );
            }),
        );

        manager.confirmBestPractices(mockDevice);

        await resetFlowPromise;
    });
});
