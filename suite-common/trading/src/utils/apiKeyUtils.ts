import { randomBytes } from 'crypto';

import { getWeakRandomId } from '@trezor/utils';

export const getRandomAccountDescriptor = () => getWeakRandomId(20);

/**
 * Creates client-generated request identifiers for catalog calls that have no selected account.
 * They are not authentication credentials. Keeping them request-scoped prevents catalog loading
 * from exposing an account-derived identifier or replacing TradeApi's current trading identity.
 */
export const createRandomTradingRequestIdentity = () => ({
    apiKey: randomBytes(32).toString('hex'),
    traceId: randomBytes(32).toString('hex'),
});
