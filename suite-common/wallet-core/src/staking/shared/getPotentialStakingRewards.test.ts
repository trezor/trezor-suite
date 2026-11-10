import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { getPotentialStakingRewards } from './getPotentialStakingRewards';

const TRX = asNetworkSymbol('trx');

const TEN_PERCENT = 10;

const mockTronAccount = (index: number, balance: string): Account =>
    ({
        key: `descriptor${index}-trx`,
        symbol: TRX,
        networkType: 'tron',
        formattedBalance: balance,
    }) as unknown as Account;

const yearlyRewards = (accounts: Account[]) =>
    getPotentialStakingRewards(accounts, TEN_PERCENT).decimalPlaces(8).toFixed();

describe('getPotentialStakingRewards', () => {
    it('adds up what every account could earn', () => {
        expect(yearlyRewards([mockTronAccount(0, '100'), mockTronAccount(1, '200')])).toBe('30');
    });

    it('leaves out an account holding less than the network lets anyone stake', () => {
        expect(yearlyRewards([mockTronAccount(0, '100'), mockTronAccount(1, '0.5')])).toBe('10');
    });

    it('is nothing when no account could stake', () => {
        expect(yearlyRewards([mockTronAccount(0, '0.5')])).toBe('0');
    });
});
