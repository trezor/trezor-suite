import { createMockDeps } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    type ApplicationInitDeps,
    type ApplicationInitState,
    type PrepareCachedEnvDataError,
    createApplicationInit,
} from './applicationInitThunk';
import { appInitActions } from './appInitSlice';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import { createAppInitCompositionRoot } from './createAppInitCompositionRoot';
import { type PostOnboardingInitState } from './postOnboardingInitThunk';

const mockPrepareCachedEnvData = jest.fn();
const mockInitMessageSystem = jest.fn();
const mockInitAnalytics = jest.fn();
const mockInitDevices = jest.fn();
const mockCreateImportedDevice = jest.fn();
const mockPostOnboardingInit = jest.fn();
const mockSetEarnYieldWorkerBaseUrl = jest.fn();
const mockSelectEarnYieldWorkerBaseUrl = jest.fn();
const mockSelectIsOnboardingFinished = jest.fn();

const createDeferredPromise = () => {
    let resolve = () => {};
    const promise = new Promise<Result<ConnectAndBlockchainInitializationStatus.Ready>>(
        promiseResolve => {
            resolve = () => promiseResolve(ok(ConnectAndBlockchainInitializationStatus.Ready));
        },
    );

    return { promise, resolve };
};

jest.mock('@suite-common/connect-init', () => ({ connectInitThunk: jest.fn() }));
jest.mock('@suite-common/token-definitions', () => ({
    periodicCheckTokenDefinitionsThunk: jest.fn(),
}));
jest.mock('@suite-common/walletconnect', () => ({ walletConnectInitThunk: jest.fn() }));

jest.mock('@suite-common/earn-stablecoin-api', () => ({
    defaultEarnYieldWorkerBaseUrl: 'https://default.invalid',
    earnYieldWorkerBaseUrl: { set: (value: string) => mockSetEarnYieldWorkerBaseUrl(value) },
}));

jest.mock('@suite-common/message-system', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        prepareCachedEnvData: () => mockPrepareCachedEnvData(),
        initMessageSystemThunk: createThunk('@test/initMessageSystem', () =>
            mockInitMessageSystem(),
        ),
    };
});

jest.mock('@suite-common/wallet-core', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        initDevicesThunk: createThunk('@test/initDevices', () => mockInitDevices()),
        createImportedDeviceThunk: createThunk('@test/createImportedDevice', () =>
            mockCreateImportedDevice(),
        ),
    };
});

jest.mock('@suite-native/analytics-redux', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        initAnalyticsThunk: createThunk('@test/initAnalytics', () => mockInitAnalytics()),
    };
});

jest.mock('@suite-native/settings', () => ({
    selectEarnYieldWorkerBaseUrl: () => mockSelectEarnYieldWorkerBaseUrl(),
    selectIsOnboardingFinished: () => mockSelectIsOnboardingFinished(),
}));

const createServiceDependencies = () => {
    const getState = jest.fn<ApplicationInitState & PostOnboardingInitState, []>();
    const mockDispatch = createMockDispatch({ getState });
    const deps = createMockDeps<ApplicationInitDeps>({
        dispatch: mockDispatch.dispatch,
        getState,
        prepareCachedEnvData: () => mockPrepareCachedEnvData(),
        setEarnYieldWorkerBaseUrl: value => mockSetEarnYieldWorkerBaseUrl(value),
        postOnboardingInit: () => mockPostOnboardingInit(),
    });

    return { ...mockDispatch, deps, getState };
};

describe(createApplicationInit.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrepareCachedEnvData.mockResolvedValue(ok());
        mockPostOnboardingInit.mockResolvedValue(
            ok(ConnectAndBlockchainInitializationStatus.Ready),
        );
        mockSelectEarnYieldWorkerBaseUrl.mockReturnValue(undefined);
        mockSelectIsOnboardingFinished.mockReturnValue(true);
    });

    it('fulfills without waiting for post-onboarding initialization', async () => {
        const postOnboardingInitDeferred = createDeferredPromise();
        mockPostOnboardingInit.mockReturnValue(postOnboardingInitDeferred.promise);
        const { actions, deps } = createServiceDependencies();

        const result = await createApplicationInit(deps)();

        expect(result).toEqual(ok());
        expect(actions).toContainEqual(appInitActions.applicationInitFinished());
        expect(mockInitDevices).toHaveBeenCalledTimes(1);
        expect(mockCreateImportedDevice).toHaveBeenCalledTimes(1);
        expect(mockPostOnboardingInit).toHaveBeenCalledTimes(1);
        expect(actions).not.toContainEqual(
            appInitActions.postOnboardingInitFinished(
                ConnectAndBlockchainInitializationStatus.Ready,
            ),
        );

        postOnboardingInitDeferred.resolve();
        await postOnboardingInitDeferred.promise;
    });

    it('skips post-onboarding initialization until onboarding is finished', async () => {
        mockSelectIsOnboardingFinished.mockReturnValue(false);
        const { actions, deps } = createServiceDependencies();

        const result = await createApplicationInit(deps)();

        expect(result).toEqual(ok());
        expect(actions).toContainEqual(appInitActions.applicationInitFinished());
        expect(mockPostOnboardingInit).not.toHaveBeenCalled();
    });

    it('leaves the application unfinished when initialization fails', async () => {
        const error: PrepareCachedEnvDataError = {
            type: 'PrepareCachedEnvDataError',
            cause: new Error('Cache preparation failed'),
        };
        mockPrepareCachedEnvData.mockResolvedValue(err(error));
        const { actions, deps } = createServiceDependencies();

        const result = await createApplicationInit(deps)();

        expect(result).toEqual(err(error));
        expect(actions).not.toContainEqual(appInitActions.applicationInitFinished());
        expect(mockInitDevices).not.toHaveBeenCalled();
        expect(mockPostOnboardingInit).not.toHaveBeenCalled();
    });

    it('converts a legacy cache-preparation rejection into an error Result at composition', async () => {
        const cause = new Error('Cache preparation failed');
        mockPrepareCachedEnvData.mockRejectedValue(cause);
        const { dispatch, getState, actions } = createServiceDependencies();
        const services = createAppInitCompositionRoot({ dispatch, getState });

        const result = await services.applicationInit();

        expect(result).toEqual(err({ type: 'PrepareCachedEnvDataError', cause }));
        expect(actions).not.toContainEqual(appInitActions.applicationInitFinished());
        expect(mockInitDevices).not.toHaveBeenCalled();
    });
});
