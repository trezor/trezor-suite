import { createMockDeps } from '@suite-common/dependency-injection';

import { createQuotaManagerFetchMock } from '../../mocks/createQuotaManagerFetchMock';
import { type QuotaManagerFetchResult } from '../../quotaManagerFetch';
import { createGenerateSessionIdMock } from '../../session/mocks/createGenerateSessionIdMock';
import { type PrepareChallengeSessionFetchDeps } from '../createPrepareChallengeSessionFetch';

type CreatePrepareChallengeSessionFetchDepsMockParams = {
    sessionIds: string[];
    quotaManagerFetchResponses: QuotaManagerFetchResult[];
    patch?: Partial<PrepareChallengeSessionFetchDeps>;
};

export const createPrepareChallengeSessionFetchDepsMock = ({
    sessionIds,
    quotaManagerFetchResponses,
    patch = {},
}: CreatePrepareChallengeSessionFetchDepsMockParams) =>
    createMockDeps<PrepareChallengeSessionFetchDeps>({
        generateSessionId: createGenerateSessionIdMock(sessionIds),
        quotaManagerFetch: createQuotaManagerFetchMock(quotaManagerFetchResponses),
        ...patch,
    });
