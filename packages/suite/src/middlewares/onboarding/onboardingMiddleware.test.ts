import { type ModalRootState, modalReducer } from '@suite/modal';
import { type RecoveryState, recoveryActions, recoveryReducer } from '@suite/recovery';
import { type RouterRootState, routerAppChanged, routerReducer } from '@suite/router';
import { type RouterStateOverrides, createRouterStateMock } from '@suite/router/mocks';
import { type AnalyticsState, analyticsInitialState } from '@suite-common/analytics-redux';
import { type DeviceRootState, deviceActions, deviceInitialState } from '@suite-common/device';
import { type FirmwareRootState, firmwareInitialState } from '@suite-common/firmware';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type DeviceUniquePath } from '@trezor/connect';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import onboardingMiddlewares from 'src/middlewares/onboarding';
import onboardingReducer from 'src/reducers/onboarding/index';
import { type OnboardingRootState } from 'src/reducers/onboarding/onboardingReducer';
import suiteReducer, { type SuiteRootState } from 'src/reducers/suite/suiteReducer';

const middlewares = [...onboardingMiddlewares];

jest.mock('@trezor/suite-storage', () => ({
    __esModule: true, // this property makes it work
    default: () => {},
}));

jest.mock('src/actions/suite/storageActions', () => ({ __esModule: true }));

type State = SuiteRootState &
    RouterRootState &
    OnboardingRootState &
    ModalRootState &
    FirmwareRootState &
    DeviceRootState & { recovery: RecoveryState; analytics: AnalyticsState };

const getInitialState = (
    router?: RouterStateOverrides,
    suite?: Partial<State['suite']>,
    onboarding?: Partial<State['onboarding']>,
    device?: Partial<State['device']>,
): State => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    router: createRouterStateMock(router),
    onboarding: {
        ...onboardingReducer(undefined, { type: 'foo' } as any),
        ...onboarding,
    },
    modal: modalReducer(undefined, { type: 'foo' } as any),
    firmware: firmwareInitialState,
    device: {
        ...deviceInitialState,
        ...device,
    },
    recovery: recoveryReducer(undefined, { type: 'foo' } as any),
    analytics: analyticsInitialState,
});

const initStore = (state: State) =>
    createTestCompositionRoot<void, State>({
        middleware: [...middlewares],
        reducer: (currentState = state, action) => ({
            ...currentState,
            suite: suiteReducer(currentState.suite, action),
            router: routerReducer(currentState.router, action),
            onboarding: onboardingReducer(currentState.onboarding, action),
        }),
        preloadedState: state,
    }).services.store;

describe('onboardingMiddleware', () => {
    describe('routerAppChanged.type', () => {
        it('payload=onboarding (into onboarding)', async () => {
            const store = initStore(
                getInitialState({
                    loaded: false,
                    pathname: '/',
                    hash: '',
                    search: '',
                    app: 'unknown',
                    params: undefined,
                    route: undefined,
                    settingsBackRoute: {
                        name: 'suite-index',
                    },
                }),
            );
            await store.dispatch({ type: routerAppChanged.type, payload: 'onboarding' });
            const result = store.getActions();
            expect(result).toEqual([
                { type: routerAppChanged.type, payload: 'onboarding' },
                { type: '@onboarding/enable-onboarding-reducer', payload: true },
            ]);
        });
    });

    describe('deviceActions.addButtonRequest.type', () => {
        const SELECTED_DEVICE_PATH = '1' as DeviceUniquePath;
        const OTHER_DEVICE_PATH = '2' as DeviceUniquePath;

        const getRecoveringDeviceState = () => {
            const device = mockSuiteDevice(
                { path: SELECTED_DEVICE_PATH },
                { recovery_status: 'Recovery' },
            );

            return { devices: [device], selectedDevice: device };
        };

        const dispatchButtonRequest = async (path: DeviceUniquePath) => {
            const store = initStore(
                getInitialState(undefined, undefined, undefined, getRecoveringDeviceState()),
            );
            await store.dispatch(
                deviceActions.addButtonRequest({
                    path,
                    buttonRequest: { code: 'ButtonRequest_Other' },
                }),
            );

            return store.getActions().map(({ type }) => type);
        };

        it('resumes the recovery of the device the button request comes from', async () => {
            expect(await dispatchButtonRequest(SELECTED_DEVICE_PATH)).toEqual([
                deviceActions.addButtonRequest.type,
                onboardingActions.updateAnalytics.type,
                recoveryActions.setStatus.type,
            ]);
        });

        it('does not resume recovery for a button request from another device', async () => {
            expect(await dispatchButtonRequest(OTHER_DEVICE_PATH)).toEqual([
                deviceActions.addButtonRequest.type,
            ]);
        });
    });
});
