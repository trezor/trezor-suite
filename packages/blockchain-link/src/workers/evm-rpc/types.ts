import type { PublicClient } from 'viem';

import type { Response } from '@trezor/blockchain-link-types';

import type { WorkerState } from '../state';

export interface Context {
    connect: () => Promise<PublicClient>;
    post: (data: Response) => void;
    state: WorkerState;
    coinName: string;
    /** A WebSocket endpoint to be told about new logs over, rather than polling for them. */
    subscriptionUrl?: string;
}

export type Request<T> = T & Context;
