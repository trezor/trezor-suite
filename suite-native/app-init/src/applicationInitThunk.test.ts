import { createMockDispatch } from '@suite-common/redux-utils/mocks';

import {
    type ApplicationInitThunkDeps,
    type ApplicationInitThunkState,
    applicationInitThunk,
} from './applicationInitThunk';
import { postOnboardingInitThunk } from './postOnboardingInitThunk';

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
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        prepareCachedEnvData: () => mockPrepareCachedEnvData(),
        initMessageSystemThunk: createThunk('@test/initMessageSystem', () =>
            mockInitMessageSystem(),
        ),
    };
});

jest.mock('@suite-common/wallet-core', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        initDevicesThunk: createThunk('@test/initDevices', () => mockInitDevices()),
        createImportedDeviceThunk: createThunk('@test/createImportedDevice', () =>
            mockCreateImportedDevice(),
        ),
    };
});

jest.mock('@suite-native/analytics-redux', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        initAnalyticsThunk: createThunk('@test/initAnalytics', () => mockInitAnalytics()),
    };
});

jest.mock('@suite-native/settings', () => ({
    selectEarnYieldWorkerBaseUrl: () => mockSelectEarnYieldWorkerBaseUrl(),
    selectIsOnboardingFinished: () => mockSelectIsOnboardingFinished(),
}));

jest.mock('./postOnboardingInitThunk', () => {
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        postOnboardingInitThunk: createThunk('@test/postOnboardingInit', () =>
            mockPostOnboardingInit(),
        ),
    };
});

const createThunkDependencies = () => {
    const getState = jest.fn<ApplicationInitThunkState, []>();
    const mockDispatch = createMockDispatch<ApplicationInitThunkState, ApplicationInitThunkDeps>({
        getState,
    });

    return { ...mockDispatch, getState };
};

describe(applicationInitThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrepareCachedEnvData.mockResolvedValue(undefined);
        mockPostOnboardingInit.mockResolvedValue(undefined);
        mockSelectEarnYieldWorkerBaseUrl.mockReturnValue(undefined);
        mockSelectIsOnboardingFinished.mockReturnValue(true);
    });

    it('fulfills without waiting for post-onboarding initialization', async () => {
        const postOnboardingInitDeferred = createDeferredPromise();
        mockPostOnboardingInit.mockReturnValue(postOnboardingInitDeferred.promise);
        const { actions, dispatch, onDispatch } = createThunkDependencies();
        const postOnboardingInitFinished = onDispatch((action, resolve) => {
            if (postOnboardingInitThunk.fulfilled.match(action)) {
                resolve();
            }
        });

        const result = await dispatch(applicationInitThunk());

        expect(applicationInitThunk.fulfilled.match(result)).toBe(true);
        expect(mockInitDevices).toHaveBeenCalledTimes(1);
        expect(mockCreateImportedDevice).toHaveBeenCalledTimes(1);
        expect(mockPostOnboardingInit).toHaveBeenCalledTimes(1);
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: postOnboardingInitThunk.fulfilled.type }),
        );

        postOnboardingInitDeferred.resolve();
        await postOnboardingInitFinished;
    });

    it('skips post-onboarding initialization until onboarding is finished', async () => {
        mockSelectIsOnboardingFinished.mockReturnValue(false);
        const { dispatch } = createThunkDependencies();

        const result = await dispatch(applicationInitThunk());

        expect(applicationInitThunk.fulfilled.match(result)).toBe(true);
        expect(mockPostOnboardingInit).not.toHaveBeenCalled();
    });
});
