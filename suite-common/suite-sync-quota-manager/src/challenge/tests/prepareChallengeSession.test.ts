import { ok } from '@trezor/type-utils';

import { generateSessionId } from '../../util/generateSessionId';
import { prepareChallengeSession } from '../prepareChallengeSession';

jest.mock('../../util/generateSessionId', () => ({
    generateSessionId: jest.fn(),
}));

// mocking generateSessionId to return predictable session IDs
(generateSessionId as jest.Mock)
    .mockReturnValueOnce('mocked-session-id')
    .mockReturnValueOnce('mocked-session-id-2');

jest.spyOn(global, 'fetch')
    .mockResolvedValueOnce(
        new Response(
            '{"challenge": "b4bc999327b7d2685890530b2814b56bba8549459aebdd551f33a1de2c5a2a8d"}',
            { status: 200 },
        ),
    )
    .mockResolvedValueOnce(
        new Response(
            '{"challenge": "b4bc999327b7d2685890530b2814b56bba8549459aebdd551f33a1de2c5a2a8dSecond"}',
            { status: 200 },
        ),
    );

describe(prepareChallengeSession.name, () => {
    it('should prepare challenge unique for each session', async () => {
        const challengeSession = await prepareChallengeSession({
            baseUrl: 'https://example.com',
        });

        const challengeSession2 = await prepareChallengeSession({
            baseUrl: 'https://example.com',
        });

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
    });
});
