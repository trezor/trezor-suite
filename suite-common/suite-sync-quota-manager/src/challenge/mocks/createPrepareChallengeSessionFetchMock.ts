import { mock } from '@suite-common/dependency-injection';

import {
    type PrepareChallengeSessionFetch,
    type PrepareChallengeSessionResult,
} from '../createPrepareChallengeSessionFetch';

export const createPrepareChallengeSessionFetchMock = (
    responses: PrepareChallengeSessionResult[],
) => {
    const impl = mock<PrepareChallengeSessionFetch>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
