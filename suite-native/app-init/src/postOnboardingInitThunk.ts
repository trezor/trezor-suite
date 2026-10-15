import {
    type MessageSystemRootState,
    selectActiveKillswitchMessage,
} from '@suite-common/message-system';
import { periodicCheckTokenDefinitionsThunk } from '@suite-common/token-definitions';
import {
    type WalletSettingsRootState,
    initStakeDataThunk,
    periodicFetchFiatRatesThunk,
    selectBaseCurrency,
} from '@suite-common/wallet-core';
import { walletConnectInitThunk } from '@suite-common/walletconnect';
import { type DispatchDep } from '@trezor/redux-utils';
import { type Result, ok } from '@trezor/type-utils';

import { appInitActions } from './appInitSlice';
import {
    type ConnectAndBlockchainInitializationResult,
    ConnectAndBlockchainInitializationStatus,
} from './appTypes';
import {
    type ConnectAndBlockchainInitDep,
    type ConnectAndBlockchainInitError,
} from './connectAndBlockchainInitThunk';

export type PostOnboardingInitState = MessageSystemRootState & WalletSettingsRootState;

export type PostOnboardingInitDeps = DispatchDep &
    ConnectAndBlockchainInitDep & {
        getState: () => PostOnboardingInitState;
    };

export type PostOnboardingInit = () => Promise<
    Result<ConnectAndBlockchainInitializationResult, ConnectAndBlockchainInitError>
>;

export type PostOnboardingInitDep = { postOnboardingInit: PostOnboardingInit };

export const createPostOnboardingInit =
    (deps: PostOnboardingInitDeps): PostOnboardingInit =>
    async () => {
        deps.dispatch(appInitActions.postOnboardingInitStarted());

        // Do not initialize Connect or related services when message-system has an
        // app-wide killswitch.
        const activeKillswitchMessage = selectActiveKillswitchMessage(deps.getState());
        if (activeKillswitchMessage) {
            deps.dispatch(
                appInitActions.postOnboardingInitFinished(
                    ConnectAndBlockchainInitializationStatus.Unavailable,
                ),
            );

            return ok(ConnectAndBlockchainInitializationStatus.Unavailable);
        }

        const connectAndBlockchainResult = await deps.connectAndBlockchainInit();

        deps.dispatch(periodicCheckTokenDefinitionsThunk());
        deps.dispatch(initStakeDataThunk());

        // These initializers could be skipped after
        // a Connect or blockchain failure if their dependent call sites were guarded individually.
        deps.dispatch(
            periodicFetchFiatRatesThunk({
                rateType: 'current',
                localCurrency: selectBaseCurrency(deps.getState()),
            }),
        );

        deps.dispatch(walletConnectInitThunk());

        deps.dispatch(
            appInitActions.postOnboardingInitFinished(
                connectAndBlockchainResult.success
                    ? ConnectAndBlockchainInitializationStatus.Ready
                    : ConnectAndBlockchainInitializationStatus.Unavailable,
            ),
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
