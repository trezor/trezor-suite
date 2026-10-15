import { createMockDeps } from '@trezor/dependency-injection';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    type ApplicationInitDeps,
    type PrepareCachedEnvDataError,
    createApplicationInit,
} from './applicationInitThunk';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';

const createDeferredPromise = <Value>() => {
    let resolve: (value: Value) => void = () => {};
    const promise = new Promise<Value>(promiseResolve => {
        resolve = promiseResolve;
    });

    return { promise, resolve };
};

const createDeps = () =>
    createMockDeps<ApplicationInitDeps>({
        prepareCachedEnvData: () => Promise.resolve(ok()),
        defaultEarnYieldWorkerBaseUrl: 'https://earn.trezor.io/yield',
        getEarnYieldWorkerBaseUrl: () => undefined,
        setEarnYieldWorkerBaseUrl: () => {},
        initAnalytics: () => {},
        initMessageSystem: () => {},
        initDevices: () => Promise.resolve(),
        createImportedDevice: () => Promise.resolve(),
        getIsOnboardingFinished: () => true,
        postOnboardingInit: () =>
            Promise.resolve(ok(ConnectAndBlockchainInitializationStatus.Ready)),
        onApplicationInitFinished: () => {},
    });

describe(createApplicationInit.name, () => {
    it('finishes without waiting for post-onboarding initialization', async () => {
        const postOnboardingInitDeferred =
            createDeferredPromise<Result<ConnectAndBlockchainInitializationStatus.Ready>>();
        const deps = createDeps();
        deps.postOnboardingInit.mockReturnValue(postOnboardingInitDeferred.promise);

        const result = await createApplicationInit(deps)();

        expect(result).toEqual(ok());
        expect(deps.onApplicationInitFinished).toHaveBeenCalledTimes(1);
        expect(deps.initDevices).toHaveBeenCalledTimes(1);
        expect(deps.createImportedDevice).toHaveBeenCalledTimes(1);
        expect(deps.postOnboardingInit).toHaveBeenCalledTimes(1);
        expect(deps.setEarnYieldWorkerBaseUrl).toHaveBeenCalledWith(
            deps.defaultEarnYieldWorkerBaseUrl,
        );

        postOnboardingInitDeferred.resolve(ok(ConnectAndBlockchainInitializationStatus.Ready));
        await postOnboardingInitDeferred.promise;
    });

    it('skips post-onboarding initialization until onboarding is finished', async () => {
        const deps = createDeps();
        deps.getIsOnboardingFinished.mockReturnValue(false);

        const result = await createApplicationInit(deps)();

        expect(result).toEqual(ok());
        expect(deps.onApplicationInitFinished).toHaveBeenCalledTimes(1);
        expect(deps.postOnboardingInit).not.toHaveBeenCalled();
    });

    it('leaves the application unfinished when cache preparation fails', async () => {
        const error: PrepareCachedEnvDataError = {
            type: 'PrepareCachedEnvDataError',
            cause: new Error('Cache preparation failed'),
        };
        const deps = createDeps();
        deps.prepareCachedEnvData.mockResolvedValue(err(error));

        const result = await createApplicationInit(deps)();

        expect(result).toEqual(err(error));
        expect(deps.onApplicationInitFinished).not.toHaveBeenCalled();
        expect(deps.initAnalytics).not.toHaveBeenCalled();
        expect(deps.initMessageSystem).not.toHaveBeenCalled();
        expect(deps.initDevices).not.toHaveBeenCalled();
        expect(deps.postOnboardingInit).not.toHaveBeenCalled();
    });

    it('uses the earn yield worker URL from debug settings', async () => {
        const deps = createDeps();
        deps.getEarnYieldWorkerBaseUrl.mockReturnValue('http://localhost:3001/yield');

        await createApplicationInit(deps)();

        expect(deps.setEarnYieldWorkerBaseUrl).toHaveBeenCalledWith('http://localhost:3001/yield');
    });

    it('selects the remembered device before creating the imported device', async () => {
        const devicesDeferred = createDeferredPromise<void>();
        const deps = createDeps();
        deps.initDevices.mockReturnValue(devicesDeferred.promise);

        const initialization = createApplicationInit(deps)();
        await Promise.resolve();

        expect(deps.createImportedDevice).not.toHaveBeenCalled();
        expect(deps.onApplicationInitFinished).not.toHaveBeenCalled();

        devicesDeferred.resolve();
        await initialization;

        expect(deps.createImportedDevice).toHaveBeenCalledTimes(1);
        expect(deps.onApplicationInitFinished).toHaveBeenCalledTimes(1);
    });
});
