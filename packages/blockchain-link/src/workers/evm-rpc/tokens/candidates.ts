import type { PublicClient } from 'viem';

import { getKnownTokens } from './knownTokens';
import type { WorkerState } from '../../state';
import { toHex } from '../utils/hex';

export type TokenCandidates = {
    /**
     * Contracts this account is known to hold or to have held, reported even at a zero balance so
     * a token stays listed after being spent, the way a blockbook-backed account behaves.
     */
    tracked: readonly `0x${string}`[];
    /** Chain-wide list, only worth reporting when the account actually holds something. */
    known: readonly `0x${string}`[];
};

export type GetTokenCandidatesParams = {
    client: PublicClient;
    state: WorkerState;
    descriptor: string;
};

// Keyed by the worker's state so two chains served by the same module never share contracts, and
// so the memory goes away with the connection.
const trackedContracts = new WeakMap<WorkerState, Map<string, Set<string>>>();

const getTrackedContracts = (state: WorkerState, descriptor: string): Set<string> => {
    let byDescriptor = trackedContracts.get(state);
    if (!byDescriptor) {
        byDescriptor = new Map();
        trackedContracts.set(state, byDescriptor);
    }

    const key = descriptor.toLowerCase();
    let contracts = byDescriptor.get(key);
    if (!contracts) {
        contracts = new Set();
        byDescriptor.set(key, contracts);
    }

    return contracts;
};

/**
 * Remembers that the account holds a contract Suite asked about by hand, so a later token listing
 * keeps reporting it and Suite does not have to ask again.
 */
export const trackTokenContract = (state: WorkerState, descriptor: string, contract: string) => {
    getTrackedContracts(state, descriptor).add(contract.toLowerCase());
};

export const getTokenCandidates = async ({
    client,
    state,
    descriptor,
}: GetTokenCandidatesParams): Promise<TokenCandidates> => {
    const tracked = [...getTrackedContracts(state, descriptor)];
    const known = (await getKnownTokens(client)).filter(
        contract => !tracked.includes(contract.toLowerCase()),
    );

    return { tracked: tracked.map(toHex), known };
};
