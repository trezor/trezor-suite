import type { PublicClient } from 'viem';

import type { WorkerState } from '@trezor/blockchain-link';
import type { Response } from '@trezor/blockchain-link-types';

export interface Context {
    connect: () => Promise<PublicClient>;
    post: (data: Response) => void;
    state: WorkerState;
    coinName: string;
}

export type Request<T> = T & Context;
