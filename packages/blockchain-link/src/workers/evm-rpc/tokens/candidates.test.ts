import type { PublicClient } from 'viem';

import { getTokenCandidates, trackTokenContract } from './candidates';
import { WorkerState } from '../../state';

const DESCRIPTOR = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';
const KNOWN_A = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
const KNOWN_B = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const;
const HAND_ADDED = '0x1111111111111111111111111111111111111111' as const;

const mockGetKnownTokens = jest.fn<Promise<readonly `0x${string}`[]>, [PublicClient]>();

jest.mock('./knownTokens', () => ({
    getKnownTokens: (client: PublicClient) => mockGetKnownTokens(client),
}));

const client = {} as PublicClient;

describe(getTokenCandidates.name, () => {
    beforeEach(() => {
        mockGetKnownTokens.mockResolvedValue([KNOWN_A, KNOWN_B]);
    });

    it('offers the known list when nothing is tracked yet', async () => {
        const state = new WorkerState();

        await expect(
            getTokenCandidates({ client, state, descriptor: DESCRIPTOR }),
        ).resolves.toEqual({ tracked: [], known: [KNOWN_A, KNOWN_B] });
    });

    it('keeps a hand-added contract as tracked and drops it from the known list', async () => {
        const state = new WorkerState();

        trackTokenContract(state, DESCRIPTOR, HAND_ADDED);
        trackTokenContract(state, DESCRIPTOR.toLowerCase(), KNOWN_A);

        await expect(
            getTokenCandidates({ client, state, descriptor: DESCRIPTOR }),
        ).resolves.toEqual({
            tracked: [HAND_ADDED.toLowerCase(), KNOWN_A.toLowerCase()],
            known: [KNOWN_B],
        });
    });

    it('tracks contracts per descriptor and per worker state', async () => {
        const state = new WorkerState();
        const otherState = new WorkerState();
        const otherDescriptor = '0x2222222222222222222222222222222222222222';

        trackTokenContract(state, DESCRIPTOR, HAND_ADDED);

        await expect(
            getTokenCandidates({ client, state, descriptor: otherDescriptor }),
        ).resolves.toMatchObject({ tracked: [] });
        await expect(
            getTokenCandidates({ client, state: otherState, descriptor: DESCRIPTOR }),
        ).resolves.toMatchObject({ tracked: [] });
    });

    it('falls back to tracked contracts only when the chain has no known list', async () => {
        mockGetKnownTokens.mockResolvedValue([]);
        const state = new WorkerState();

        trackTokenContract(state, DESCRIPTOR, HAND_ADDED);

        await expect(
            getTokenCandidates({ client, state, descriptor: DESCRIPTOR }),
        ).resolves.toEqual({ tracked: [HAND_ADDED.toLowerCase()], known: [] });
    });
});
