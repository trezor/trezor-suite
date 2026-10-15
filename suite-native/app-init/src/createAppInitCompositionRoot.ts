import { earnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-api';
import { prepareCachedEnvData } from '@suite-common/message-system';
import { type DispatchDep } from '@trezor/redux-utils';
import { err, ok } from '@trezor/type-utils';

import {
    type ApplicationInitDep,
    type ApplicationInitState,
    type PrepareCachedEnvDataError,
    createApplicationInit,
} from './applicationInitThunk';
import { createConnectAndBlockchainInit } from './connectAndBlockchainInitThunk';
import {
    type PostOnboardingInitDep,
    type PostOnboardingInitState,
    createPostOnboardingInit,
} from './postOnboardingInitThunk';

export type AppInitCompositionRootDeps = DispatchDep & {
    getState: () => ApplicationInitState & PostOnboardingInitState;
};

export const createAppInitCompositionRoot = (
    deps: AppInitCompositionRootDeps,
): ApplicationInitDep & PostOnboardingInitDep => {
    const connectAndBlockchainInit = createConnectAndBlockchainInit(deps);
    const postOnboardingInit = createPostOnboardingInit({ ...deps, connectAndBlockchainInit });
    const applicationInit = createApplicationInit({
        ...deps,
        postOnboardingInit,
        prepareCachedEnvData: () =>
            prepareCachedEnvData().then(
                () => ok(),
                (cause: unknown) =>
                    err<PrepareCachedEnvDataError>({ type: 'PrepareCachedEnvDataError', cause }),
            ),
        setEarnYieldWorkerBaseUrl: url => earnYieldWorkerBaseUrl.set(url),
    });

    return { applicationInit, postOnboardingInit };
};
