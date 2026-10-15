import { createMockDeps } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type ApplicationInitDeps,
    type ApplicationInitState,
    createApplicationInit,
} from './applicationInitThunk';
import { appInitActions } from './appInitSlice';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';

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
    const promise = new Promise<void>(promiseResolve => {
        resolve = () => promiseResolve();
    });

    return { promise, resolve };
};

jest.mock('@suite-common/earn-stablecoin-api', () => ({
    defaultEarnYieldWorkerBaseUrl: 'https://default.invalid',
    earnYieldWorkerBaseUrl: { set: (value: string) => mockSetEarnYieldWorkerBaseUrl(value) },
}));

jest.mock('@suite-common/message-system', () => {
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
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
    const getState = jest.fn<ApplicationInitState, []>();
    const mockDispatch = createMockDispatch({ getState });
    const deps = createMockDeps<ApplicationInitDeps>({
        dispatch: mockDispatch.dispatch,
        getState,
        prepareCachedEnvData: () => mockPrepareCachedEnvData(),
        setEarnYieldWorkerBaseUrl: value => mockSetEarnYieldWorkerBaseUrl(value),
        postOnboardingInit: () => mockPostOnboardingInit(),
    });

    return { ...mockDispatch, deps };
};

describe(createApplicationInit.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrepareCachedEnvData.mockResolvedValue(undefined);
        mockPostOnboardingInit.mockResolvedValue(ConnectAndBlockchainInitializationStatus.Ready);
        mockSelectEarnYieldWorkerBaseUrl.mockReturnValue(undefined);
        mockSelectIsOnboardingFinished.mockReturnValue(true);
    });

    it('fulfills without waiting for post-onboarding initialization', async () => {
        const postOnboardingInitDeferred = createDeferredPromise();
        mockPostOnboardingInit.mockReturnValue(postOnboardingInitDeferred.promise);
        const { actions, deps } = createServiceDependencies();

        await createApplicationInit(deps)();

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

        await createApplicationInit(deps)();

        expect(actions).toContainEqual(appInitActions.applicationInitFinished());
        expect(mockPostOnboardingInit).not.toHaveBeenCalled();
    });

    it('leaves the application unfinished when initialization fails', async () => {
        mockPrepareCachedEnvData.mockRejectedValue(new Error('Unexpected error'));
        const { actions, deps } = createServiceDependencies();

        await createApplicationInit(deps)();

        expect(actions).not.toContainEqual(appInitActions.applicationInitFinished());
        expect(mockInitDevices).not.toHaveBeenCalled();
        expect(mockPostOnboardingInit).not.toHaveBeenCalled();
    });
});
