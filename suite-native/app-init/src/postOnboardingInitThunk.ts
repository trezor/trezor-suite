import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type Result, ok } from '@trezor/type-utils';

import {
    type ConnectAndBlockchainInitializationResult,
    ConnectAndBlockchainInitializationStatus,
} from './appTypes';
import {
    type ConnectAndBlockchainInitDep,
    type ConnectAndBlockchainInitError,
} from './connectAndBlockchainInitThunk';

export type InitFiatRatesParams = {
    rateType: 'current';
    localCurrency: BaseCurrencyCode;
};

export type PostOnboardingInitDeps = ConnectAndBlockchainInitDep & {
    getIsKillswitchActive: () => boolean;
    periodicCheckTokenDefinitions: () => void;
    initStakeData: () => void;
    periodicFetchFiatRates: (params: InitFiatRatesParams) => void;
    getBaseCurrency: () => BaseCurrencyCode;
    walletConnectInit: () => void;
    onPostOnboardingInitStarted: () => void;
    onPostOnboardingInitFinished: (status: ConnectAndBlockchainInitializationResult) => void;
};

export type PostOnboardingInit = () => Promise<
    Result<ConnectAndBlockchainInitializationResult, ConnectAndBlockchainInitError>
>;

export type PostOnboardingInitDep = { postOnboardingInit: PostOnboardingInit };

export const createPostOnboardingInit =
    (deps: PostOnboardingInitDeps): PostOnboardingInit =>
    async () => {
        deps.onPostOnboardingInitStarted();

        // Do not initialize Connect or related services when message-system has an
        // app-wide killswitch.
        if (deps.getIsKillswitchActive()) {
            deps.onPostOnboardingInitFinished(ConnectAndBlockchainInitializationStatus.Unavailable);

            return ok(ConnectAndBlockchainInitializationStatus.Unavailable);
        }

        const connectAndBlockchainResult = await deps.connectAndBlockchainInit();

        deps.periodicCheckTokenDefinitions();
        deps.initStakeData();

        // These initializers could be skipped after
        // a Connect or blockchain failure if their dependent call sites were guarded individually.
        deps.periodicFetchFiatRates({
            rateType: 'current',
            localCurrency: deps.getBaseCurrency(),
        });

        deps.walletConnectInit();

        deps.onPostOnboardingInitFinished(
            connectAndBlockchainResult.success
                ? ConnectAndBlockchainInitializationStatus.Ready
                : ConnectAndBlockchainInitializationStatus.Unavailable,
        );

        if (!connectAndBlockchainResult.success) {
            return connectAndBlockchainResult;
        }

        return ok(ConnectAndBlockchainInitializationStatus.Ready);
    };

export const injectPostOnboardingInit = (
    services: PostOnboardingInitDep,
): PostOnboardingInitDep => ({
    postOnboardingInit: services.postOnboardingInit,
});
