import { type AdaPools } from '@suite-common/earn-staking-api';
import { type Account } from '@suite-common/wallet-types';

import * as fixtures from './__fixtures__/cardanoStakingUtils';
import { CARDANO_EVERSTAKE_STAKING_POOL } from './cardanoStakingConstants';
import {
    hasCardanoLiveVoteDelegation,
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithEverstake,
    isCardanoStakedWithFiveBinaries,
    parseDrepBech32,
    poolBech32ToHex,
    selectBestCardanoPool,
    validateCardanoDrep,
} from './cardanoStakingUtils';

// A real, decodable Cardano pool id (bech32, "pool1..." prefix).
const VALID_POOL_ID = 'pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u';

// Fixtures generated with @scure/base bech32.encode('drep', toWords(payload)):
// - 28-byte payload            -> CIP-105 legacy DRep (key hash)
// - 0x22 header + 28-byte hash -> CIP-129 DRep (key hash)
// - 0x23 header + 28-byte hash -> CIP-129 DRep (script hash)
// - 0x00 header + 28-byte hash -> bech32-valid but UNSUPPORTED CIP-129 header
const CIP105_KEY_HASH = 'drep14w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46kxzm6ac';
const CIP129_KEY_HASH = 'drep1y246h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2caa85du';
const CIP129_UNSUPPORTED_HEADER = 'drep1qz46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2c0qll2j';

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

describe('validateCardanoDrep', () => {
    it('accepts a valid CIP-105 (28-byte) DRep id', () => {
        expect(validateCardanoDrep(CIP105_KEY_HASH)).toBe(true);
    });

    it('accepts a valid CIP-129 (29-byte) DRep id with a supported header', () => {
        expect(validateCardanoDrep(CIP129_KEY_HASH)).toBe(true);
    });

    it('rejects a non-bech32 / garbage string', () => {
        expect(validateCardanoDrep('not-a-drep')).toBe(false);
        expect(validateCardanoDrep('')).toBe(false);
    });

    // Regression: a bech32-valid 29-byte id whose header byte is not a supported
    // CIP-129 DRep type previously passed validation but then made parseDrepBech32
    // throw during transaction composition (unhandled rejection). Validation must
    // stay aligned with parsing.
    it('rejects a bech32-valid CIP-129 id with an unsupported header byte', () => {
        expect(validateCardanoDrep(CIP129_UNSUPPORTED_HEADER)).toBe(false);
    });
});

describe('parseDrepBech32', () => {
    it('parses a supported CIP-129 DRep id without throwing', () => {
        expect(() => parseDrepBech32(CIP129_KEY_HASH)).not.toThrow();
    });

    // parseDrepBech32 is only reached for ids that validateCardanoDrep accepts (or
    // for the trusted fallback constant); an unsupported-header id must be rejected
    // by the leading validateCardanoDrep guard rather than reaching parseDrepCip129.
    it('rejects an unsupported-header CIP-129 id via the validation guard', () => {
        expect(() => parseDrepBech32(CIP129_UNSUPPORTED_HEADER)).toThrow('Not a DRep bech32');
    });
});

describe('selectBestCardanoPool (untrusted pool id hardening)', () => {
    it('returns the Everstake fallback for an empty/undefined pools list', () => {
        expect(selectBestCardanoPool(undefined)).toBe(CARDANO_EVERSTAKE_STAKING_POOL);
        expect(selectBestCardanoPool([])).toBe(CARDANO_EVERSTAKE_STAKING_POOL);
    });

    it('picks a pool within the saturation threshold and decodes its id', () => {
        const result = selectBestCardanoPool([{ id: VALID_POOL_ID, saturation: 10, apy: 5 }]);

        expect(result.bech32).toBe(VALID_POOL_ID);
        expect(result.hex).toMatch(/^[0-9a-f]+$/);
    });

    // Regression: the earn-staking backend response schema validates pool.id only as a
    // string, not as a decodable bech32 pool id. poolBech32ToHex (bech32.decode) throws on a
    // malformed id, and selectBestCardanoPool runs inside the render-time selector
    // selectPoolStatsApy — a throw there would crash the render. A malformed id must fall
    // back to the Everstake pool instead of throwing.
    it('does not throw and falls back to Everstake when the selected pool id is not decodable', () => {
        expect(() =>
            selectBestCardanoPool([{ id: 'not-a-bech32-pool-id', saturation: 10, apy: 5 }]),
        ).not.toThrow();

        expect(
            selectBestCardanoPool([{ id: 'not-a-bech32-pool-id', saturation: 10, apy: 5 }]),
        ).toBe(CARDANO_EVERSTAKE_STAKING_POOL);
    });

    // The fallback branch (lowest-saturation pool) must be throw-safe too.
    it('does not throw when the lowest-saturation fallback pool id is not decodable', () => {
        expect(() =>
            selectBestCardanoPool([{ id: 'still-not-bech32', saturation: 90, apy: 1 }]),
        ).not.toThrow();
    });
});
