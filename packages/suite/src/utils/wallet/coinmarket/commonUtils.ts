import { Account } from '@suite-common/wallet-types';

export function hasNetworkTypeTradableTokens(networkType: Account['networkType']) {
    return (
        ['ethereum', 'solana'] satisfies Account['networkType'][] as Account['networkType'][]
    ).includes(networkType);
}
