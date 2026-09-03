import { type AdaPools } from '@suite-common/earn-staking-api';
import { CARDANO_EVERSTAKE_STAKING_POOL } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';

import * as fixtures from './__fixtures__/cardanoStakingUtils';
import {
    hasCardanoLiveVoteDelegation,
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
    poolBech32ToHex,
    selectBestCardanoPool,
} from './cardanoStakingUtils';

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

    fixtures.hasCardanoLiveVoteDelegation.forEach(f => {
        it(`hasCardanoLiveVoteDelegation: ${f.description}`, () => {
            expect(hasCardanoLiveVoteDelegation(f.account as Account)).toBe(f.result);
        });
    });
});
