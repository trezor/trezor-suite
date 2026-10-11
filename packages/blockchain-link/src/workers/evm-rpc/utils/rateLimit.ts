import type { PublicClient } from 'viem';

import { type RpcErrorInfo, getRpcErrorInfo } from './errors';

const RATE_LIMIT_EXCEEDED = -32005;
const HTTP_TOO_MANY_REQUESTS = 429;

// A batched request turned away at the HTTP level fails every query it carried at once, so a 429
// has to back off like a JSON-RPC rate limit rather than abandon the whole batch.
export const isRateLimited = ({ code, status, message }: RpcErrorInfo) =>
    code === RATE_LIMIT_EXCEEDED ||
    status === HTTP_TOO_MANY_REQUESTS ||
    /rate limit/i.test(message);

// When a provider's rate limit last cost an answer something, per connection. Reads that fail are
// mostly skipped rather than failing the whole request, so this is what tells the user it happened.
const lastLosses = new WeakMap<PublicClient, number>();

/** Records a failed read that was given up on, if the provider's rate limit was why. */
export const recordRateLimitLoss = (client: PublicClient, error: unknown) => {
    if (isRateLimited(getRpcErrorInfo(error))) {
        lastLosses.set(client, Date.now());
    }
};

export const wasRateLimitedSince = (client: PublicClient, since: number) =>
    (lastLosses.get(client) ?? -1) >= since;
