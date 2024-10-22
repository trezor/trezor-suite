import { Account } from '@suite-common/wallet-types';
import { isArrayMember } from '@trezor/type-utils';

export function hasNetworkTypeTradableTokens(networkType: Account['networkType']) {
    return isArrayMember(networkType, ['ethereum', 'solana'] satisfies Account['networkType'][]);
}
