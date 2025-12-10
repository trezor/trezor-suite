import { ok } from '@trezor/type-utils';

import { quotaManagerFetch } from '../quotaManagerFetch';
import { generateSessionId } from '../util/generateSessionId';

type PrepareChallengeSessionParams = {
    baseUrl: string | null;
};

type ChallengeResponse = {
    challenge: string;
};

export const prepareChallengeSession = async ({ baseUrl }: PrepareChallengeSessionParams) => {
    const sessionId = generateSessionId();

    const challengeResponse = await quotaManagerFetch({
        baseUrl,
        path: '/challenge',
        method: 'POST',
        body: { sessionId },
    });

    if (!challengeResponse.ok) {
        return challengeResponse;
    }

    return ok({
        sessionId,
        challenge: (challengeResponse.value as ChallengeResponse).challenge,
    });
};
