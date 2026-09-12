import { type AdaPools } from '@suite-common/earn-staking-api';
import { type Account } from '@suite-common/wallet-types';

import * as fixtures from './__fixtures__/cardanoStakingUtils';
import { CARDANO_EVERSTAKE_STAKING_POOL } from './cardanoStakingConstants';
import {
    areCardanoDrepIdsEqual,
    decodeCardanoDrepId,
    getCardanoAccountDrepId,
    hasCardanoLiveVoteDelegation,
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
    normalizeCardanoDrepId,
    poolBech32ToHex,
    selectBestCardanoPool,
    validateCardanoDrep,
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

    fixtures.validateCardanoDrep.forEach(f => {
        it(`validateCardanoDrep: ${f.description}`, () => {
            expect(validateCardanoDrep(f.drepId)).toBe(f.result);
        });
    });

    fixtures.decodeCardanoDrepId.forEach(f => {
        it(`decodeCardanoDrepId: ${f.description}`, () => {
            expect(decodeCardanoDrepId(f.drepId)).toEqual(f.result);
        });
    });

    fixtures.normalizeCardanoDrepId.forEach(f => {
        it(`normalizeCardanoDrepId: ${f.description}`, () => {
            expect(normalizeCardanoDrepId(f.drepId)).toBe(f.result);
        });
    });

    it('normalizeCardanoDrepId: normalizing a canonical id changes nothing', () => {
        fixtures.normalizeCardanoDrepId.forEach(f => {
            const normalizedDrepId = normalizeCardanoDrepId(f.drepId);

            if (normalizedDrepId === null) return;

            expect(normalizeCardanoDrepId(normalizedDrepId)).toBe(normalizedDrepId);
        });
    });

    fixtures.areCardanoDrepIdsEqual.forEach(f => {
        it(`areCardanoDrepIdsEqual: ${f.description}`, () => {
            expect(areCardanoDrepIdsEqual(f.drepIdA, f.drepIdB)).toBe(f.result);
            expect(areCardanoDrepIdsEqual(f.drepIdB, f.drepIdA)).toBe(f.result);
        });
    });

    fixtures.getCardanoAccountDrepId.forEach(f => {
        it(`getCardanoAccountDrepId: ${f.description}`, () => {
            expect(getCardanoAccountDrepId(f.account as Account)).toBe(f.result);
        });
    });
});
