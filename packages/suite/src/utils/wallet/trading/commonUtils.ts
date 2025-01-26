import { Account } from '@suite-common/wallet-types';
import { isArrayMember } from '@trezor/utils';

export function hasNetworkTypeTradableTokens(networkType: Account['networkType']) {
    return isArrayMember(networkType, ['ethereum', 'solana'] satisfies Account['networkType'][]);
}
