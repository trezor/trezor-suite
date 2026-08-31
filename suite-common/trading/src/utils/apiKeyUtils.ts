import { randomBytes } from 'crypto';

import { getWeakRandomId } from '@trezor/utils';

export const getRandomAccountDescriptor = () => getWeakRandomId(20);

export const createRandomTradingRequestIdentity = () => ({
    apiKey: randomBytes(32).toString('hex'),
    traceId: randomBytes(32).toString('hex'),
});
