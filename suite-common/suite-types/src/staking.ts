import { Account } from '@suite-common/wallet-types';

export enum EarnFlow {
    Stake = 'stake',
    Yield = 'yield',
    UpdateProvider = 'update-provider',
}

export enum EarnProvider {
    Everstake = 'everstake',
    YieldXyz = 'yield-xyz',
}

export type EarnAccountRef = {
    descriptor: Account['descriptor'];
    symbol: Account['symbol'];
    deviceStaticSessionId: Account['deviceState'];
};

export const createEarnAccountRef = (
    account: Pick<Account, 'descriptor' | 'symbol' | 'deviceState'>,
): EarnAccountRef => ({
    descriptor: account.descriptor,
    symbol: account.symbol,
    deviceStaticSessionId: account.deviceState,
});
