import { createMockDeps } from '@trezor/dependency-injection';
import { err, ok } from '@trezor/type-utils';

import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import { type ConnectAndBlockchainInitError } from './connectAndBlockchainInitThunk';
import { type PostOnboardingInitDeps, createPostOnboardingInit } from './postOnboardingInitThunk';

const createDeps = () =>
    createMockDeps<PostOnboardingInitDeps>({
        getIsKillswitchActive: () => false,
        connectAndBlockchainInit: () => Promise.resolve(ok()),
        periodicCheckTokenDefinitions: () => {},
        initStakeData: () => {},
        periodicFetchFiatRates: () => {},
        getBaseCurrency: () => 'usd',
        walletConnectInit: () => {},
        onPostOnboardingInitStarted: () => {},
        onPostOnboardingInitFinished: () => {},
    });

const expectFollowUpServicesToHaveStarted = (deps: PostOnboardingInitDeps) => {
    expect(deps.periodicCheckTokenDefinitions).toHaveBeenCalledTimes(1);
    expect(deps.initStakeData).toHaveBeenCalledTimes(1);
    expect(deps.periodicFetchFiatRates).toHaveBeenCalledWith({
        rateType: 'current',
        localCurrency: 'usd',
    });
    expect(deps.walletConnectInit).toHaveBeenCalledTimes(1);
};

describe(createPostOnboardingInit.name, () => {
    it('disables initialization when the app-wide killswitch is active', async () => {
        const deps = createDeps();
        deps.getIsKillswitchActive.mockReturnValue(true);

        const result = await createPostOnboardingInit(deps)();

        expect(result).toEqual(ok(ConnectAndBlockchainInitializationStatus.Unavailable));
        expect(deps.connectAndBlockchainInit).not.toHaveBeenCalled();
        expect(deps.periodicCheckTokenDefinitions).not.toHaveBeenCalled();
        expect(deps.initStakeData).not.toHaveBeenCalled();
        expect(deps.periodicFetchFiatRates).not.toHaveBeenCalled();
        expect(deps.walletConnectInit).not.toHaveBeenCalled();
        expect(deps.onPostOnboardingInitFinished).toHaveBeenCalledWith(
            ConnectAndBlockchainInitializationStatus.Unavailable,
        );
    });

    it('starts follow-up services after Connect and blockchain initialization', async () => {
        const deps = createDeps();

        const result = await createPostOnboardingInit(deps)();

        expect(result).toEqual(ok(ConnectAndBlockchainInitializationStatus.Ready));
        expect(deps.connectAndBlockchainInit).toHaveBeenCalledTimes(1);
        expectFollowUpServicesToHaveStarted(deps);
        expect(deps.onPostOnboardingInitFinished).toHaveBeenCalledWith(
            ConnectAndBlockchainInitializationStatus.Ready,
        );
    });

    it('starts follow-up services and propagates the initialization error as unavailable', async () => {
        const error: ConnectAndBlockchainInitError = {
            type: 'ConnectInitError',
            error: { message: 'Connect init failed' },
        };
        const initializationError = err(error);
        const deps = createDeps();
        deps.connectAndBlockchainInit.mockResolvedValue(initializationError);

        const result = await createPostOnboardingInit(deps)();

        expect(result).toBe(initializationError);
        expectFollowUpServicesToHaveStarted(deps);
        expect(deps.onPostOnboardingInitStarted).toHaveBeenCalledTimes(1);
        expect(deps.onPostOnboardingInitFinished).toHaveBeenCalledWith(
            ConnectAndBlockchainInitializationStatus.Unavailable,
        );
    });
});
