import { type AdaPools } from '@suite-common/earn-staking-api';
import { CARDANO_EVERSTAKE_STAKING_POOL } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import { mockCardanoStakingAccount } from '@suite-common/wallet-types/mocks';

import * as fixtures from './__fixtures__/cardanoStakingUtils';
import {
    areCardanoDrepIdsEqual,
    decodeCardanoDrepId,
    getCardanoAccountDrepId,
    getCardanoCurrentVotingOption,
    hasCardanoLiveVoteDelegation,
    isCardanoDrepIdCip129,
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
    isCardanoWithdrawalBlockedByMissingDrep,
    normalizeCardanoDrepId,
    poolBech32ToHex,
    selectBestCardanoPool,
    validateCardanoDrep,
} from './cardanoStakingUtils';

describe('cardano staking utils', () => {
    it('recognizes a no-confidence delegation as its own voting option', () => {
        const account = mockCardanoStakingAccount('everstake');
        account.misc = {
            ...account.misc,
            staking: {
                ...account.misc.staking,
                drep: {
                    drep_id: 'drep_always_no_confidence',
                    hex: '',
                    amount: '0',
                    active: true,
                    active_epoch: null,
                    has_script: false,
                },
            },
        };

        expect(getCardanoCurrentVotingOption(account)).toEqual({ type: 'no_confidence' });
    });

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

    fixtures.isCardanoWithdrawalBlockedByMissingDrep.forEach(f => {
        it(`isCardanoWithdrawalBlockedByMissingDrep: ${f.description}`, () => {
            expect(isCardanoWithdrawalBlockedByMissingDrep(f.account as Account)).toBe(f.result);
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

    fixtures.isCardanoDrepIdCip129.forEach(f => {
        it(`isCardanoDrepIdCip129: ${f.description}`, () => {
            expect(isCardanoDrepIdCip129(f.drepId)).toBe(f.result);
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
