import { type AdaPools } from '@suite-common/earn-staking-api';
import { CARDANO_EVERSTAKE_STAKING_POOL, EVERSTAKE_POOLS } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';

import * as fixtures from './__fixtures__/cardanoStakingUtils';
import {
    hasCardanoStakingRewards,
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
    poolBech32ToHex,
    selectBestCardanoPool,
} from './cardanoStakingUtils';

const [everstakePool] = EVERSTAKE_POOLS as [string];

describe('cardano staking utils', () => {
    fixtures.selectBestCardanoPool.forEach(f => {
        it(`selectBestCardanoPool: ${f.description}`, () => {
            expect(selectBestCardanoPool(f.pools).bech32).toEqual(f.result);
        });
    });

    fixtures.selectBestCardanoPoolWithCurrentPool.forEach(f => {
        it(`selectBestCardanoPool: ${f.description}`, () => {
            expect(selectBestCardanoPool(f.pools, f.currentPoolId).bech32).toEqual(f.result);
        });
    });

    it('selectBestCardanoPool: returns the bech32 id together with its hex form', () => {
        expect(selectBestCardanoPool(undefined)).toEqual(CARDANO_EVERSTAKE_STAKING_POOL);
        expect(poolBech32ToHex(CARDANO_EVERSTAKE_STAKING_POOL.bech32)).toEqual(
            CARDANO_EVERSTAKE_STAKING_POOL.hex,
        );
    });

    fixtures.isCardanoStakedWithEverstake.forEach(f => {
        it(`isCardanoStakedWithEverstake: ${f.description}`, () => {
            expect(
                isCardanoStakedWithEverstake(f.account as Account, f.pools as AdaPools['pools']),
            ).toBe(f.result);
        });
    });

    fixtures.isCardanoStakedOutsideEverstake.forEach(f => {
        it(`isCardanoStakedOutsideEverstake: ${f.description}`, () => {
            expect(
                isCardanoStakedOutsideEverstake(f.account as Account, f.pools as AdaPools['pools']),
            ).toBe(f.result);
        });
    });

    fixtures.isCardanoStakedWithFiveBinaries.forEach(f => {
        it(`isCardanoStakedWithFiveBinaries: ${f.description}`, () => {
            expect(isCardanoStakedWithFiveBinaries(f.account as Account)).toBe(f.result);
        });
    });

    describe('hasCardanoStakingRewards', () => {
        const adaAccount = (staking: object) =>
            ({ networkType: 'cardano', misc: { staking } }) as unknown as Account;

        it('is true with accrued rewards', () => {
            expect(hasCardanoStakingRewards(adaAccount({ rewards: '15000000' }))).toBe(true);
        });

        it('is false when no rewards have accrued yet', () => {
            expect(hasCardanoStakingRewards(adaAccount({ rewards: '0' }))).toBe(false);
        });

        it('is false for a delegated account before the first rewards payload arrives', () => {
            expect(hasCardanoStakingRewards(adaAccount({ poolId: everstakePool }))).toBe(false);
        });

        it('is false for a non-cardano account', () => {
            expect(
                hasCardanoStakingRewards({ networkType: 'ethereum' } as unknown as Account),
            ).toBe(false);
        });
    });
});
