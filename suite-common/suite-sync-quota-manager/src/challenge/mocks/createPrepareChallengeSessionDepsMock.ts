import { createMockDeps } from '@suite-common/dependency-injection';

import { createQuotaManagerFetchMock } from '../../mocks/createQuotaManagerFetchMock';
import { type QuotaManagerFetchResult } from '../../quotaManagerFetch';
import { createGenerateSessionIdMock } from '../../session/mocks/createGenerateSessionIdMock';
import { type PrepareChallengeSessionDeps } from '../createPrepareChallengeSessionFetch';

type CreatePrepareChallengeSessionDepsMockParams = {
    sessionIds: string[];
    quotaManagerFetchResponses: QuotaManagerFetchResult[];
    patch?: Partial<PrepareChallengeSessionDeps>;
};

export const createPrepareChallengeSessionDepsMock = ({
    sessionIds,
    quotaManagerFetchResponses,
    patch = {},
}: CreatePrepareChallengeSessionDepsMockParams) =>
    createMockDeps<PrepareChallengeSessionDeps>({
        generateSessionId: createGenerateSessionIdMock(sessionIds),
        quotaManagerFetch: createQuotaManagerFetchMock(quotaManagerFetchResponses),
        ...patch,
    });
