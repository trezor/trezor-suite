import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

/**
 * Only Bitcoin-like accounts sign in two formats, so they are the only ones where the user picks
 * one. Empty accountTypes means the network has the 'normal' account type alone and both formats
 * produce the same signature.
 */
export const getHasSelectableSignatureFormat = (account: Account): boolean =>
    account.networkType === 'bitcoin' &&
    account.accountType !== 'legacy' &&
    Object.keys(getNetwork(account.symbol).accountTypes).length >= 1;
