import type { Account } from '@suite-common/wallet-types';

/** Mobile has no Suite Native network modules yet, so it decides here which networks verify. */
export const isVerifySupported = (account: Account) =>
    account.networkType === 'bitcoin' || account.networkType === 'ethereum';
