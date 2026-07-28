import { ok } from '@trezor/type-utils';

import { createPrepareChallengeSessionFetch } from './createPrepareChallengeSessionFetch';
import { createPrepareChallengeSessionDepsMock } from './mocks/createPrepareChallengeSessionDepsMock';

describe(createPrepareChallengeSessionFetch.name, () => {
    it('should prepare challenge unique for each session', async () => {
        const deps = createPrepareChallengeSessionDepsMock({
            sessionIds: ['mocked-session-id', 'mocked-session-id-2'],
            quotaManagerFetchResponses: [
                ok({
                    challenge: 'b4bc999327b7d2685890530b2814b56bba8549459aebdd551f33a1de2c5a2a8d',
                }),
                ok({
                    challenge:
                        'b4bc999327b7d2685890530b2814b56bba8549459aebdd551f33a1de2c5a2a8dSecond',
                }),
            ],
        });

        const prepareChallengeSession = createPrepareChallengeSessionFetch(deps);

        const challengeSession = await prepareChallengeSession();
        const challengeSession2 = await prepareChallengeSession();

        expect(challengeSession).toEqual(
            ok({
                sessionId: 'mocked-session-id',
                challenge: 'b4bc999327b7d2685890530b2814b56bba8549459aebdd551f33a1de2c5a2a8d',
            }),
        );
        expect(challengeSession2).toEqual(
            ok({
                sessionId: 'mocked-session-id-2',
                challenge: 'b4bc999327b7d2685890530b2814b56bba8549459aebdd551f33a1de2c5a2a8dSecond',
            }),
        );

        expect(deps.quotaManagerFetch).toHaveBeenNthCalledWith(1, {
            path: '/challenge',
            method: 'POST',
            body: { sessionId: 'mocked-session-id' },
        });
        expect(deps.quotaManagerFetch).toHaveBeenNthCalledWith(2, {
            path: '/challenge',
            method: 'POST',
            body: { sessionId: 'mocked-session-id-2' },
        });
        expect(deps.generateSessionId).toHaveBeenCalledTimes(2);
    });
});
