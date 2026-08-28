import { type Result, ok } from '@trezor/type-utils';

import {
    type QuotaManagerFetchCommunicationError,
    type QuotaManagerFetchDep,
} from '../quotaManagerFetch';
import { type GenerateSessionIdDep } from '../session/generateSessionId';

type ChallengeResponse = {
    sessionId: string;
    challenge: string;
};

export type PrepareChallengeSessionResult = Result<
    ChallengeResponse,
    QuotaManagerFetchCommunicationError
>;

export type PrepareChallengeSessionFetch = () => Promise<PrepareChallengeSessionResult>;

export type PrepareChallengeSessionFetchDep = {
    prepareChallengeSessionFetch: PrepareChallengeSessionFetch;
};

export type PrepareChallengeSessionFetchDeps = QuotaManagerFetchDep & GenerateSessionIdDep;

export const createPrepareChallengeSessionFetch =
    (deps: PrepareChallengeSessionFetchDeps): PrepareChallengeSessionFetch =>
    async () => {
        const sessionId = deps.generateSessionId();

        const challengeResponse = await deps.quotaManagerFetch({
            path: '/challenge',
            method: 'POST',
            body: { sessionId },
        });

        if (!challengeResponse.success) {
            return challengeResponse;
        }

        return ok({
            sessionId,
            challenge: (challengeResponse.payload as ChallengeResponse).challenge,
        });
    };
