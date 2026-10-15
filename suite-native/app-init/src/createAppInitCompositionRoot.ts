import { earnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-api';
import { prepareCachedEnvData } from '@suite-common/message-system';
import { type DispatchDep } from '@trezor/redux-utils';

import {
    type ApplicationInitDep,
    type ApplicationInitState,
    createApplicationInit,
} from './createApplicationInit';
import { createConnectAndBlockchainInit } from './createConnectAndBlockchainInit';
import {
    type PostOnboardingInitDep,
    type PostOnboardingInitState,
    createPostOnboardingInit,
} from './createPostOnboardingInit';

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
        prepareCachedEnvData,
        setEarnYieldWorkerBaseUrl: url => earnYieldWorkerBaseUrl.set(url),
    });

    return { applicationInit, postOnboardingInit };
};
