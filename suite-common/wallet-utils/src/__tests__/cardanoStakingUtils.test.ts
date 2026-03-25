import { CARDANO_EVERSTAKE_STAKING_POOL, EVERSTAKE_POOLS } from '@suite-common/wallet-constants';

import { selectBestCardanoPool } from '../cardanoStakingUtils';

const POOL_A = EVERSTAKE_POOLS[0]; // pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn
const POOL_B = EVERSTAKE_POOLS[1]; // pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj

describe('selectBestCardanoPool', () => {
    it('returns fallback pool when no pools are provided', () => {
        expect(selectBestCardanoPool()).toEqual(CARDANO_EVERSTAKE_STAKING_POOL);
        expect(selectBestCardanoPool([])).toEqual(CARDANO_EVERSTAKE_STAKING_POOL);
    });

    it('returns the best (most saturated below threshold) pool when no current pool is given', () => {
        const pools = [
            { id: POOL_A, saturation: 50, apy: 4.2 },
            { id: POOL_B, saturation: 30, apy: 4.3 },
        ];

        // Sorts highest to lowest saturation, picks first below 75% → POOL_A (50%)
        const result = selectBestCardanoPool(pools);
        expect(result?.bech32).toEqual(POOL_A);
    });

    it("keeps the user's current pool when it is not oversaturated", () => {
        const pools = [
            { id: POOL_A, saturation: 50, apy: 4.2 },
            { id: POOL_B, saturation: 30, apy: 4.3 },
        ];

        // User is in POOL_B (30% saturation < 75% threshold) → should stay in POOL_B
        const result = selectBestCardanoPool(pools, POOL_B);
        expect(result?.bech32).toEqual(POOL_B);
    });

    it('migrates the user when their current pool is oversaturated', () => {
        const pools = [
            { id: POOL_A, saturation: 80, apy: 4.2 }, // oversaturated
            { id: POOL_B, saturation: 30, apy: 4.3 }, // not oversaturated
        ];

        // User is in POOL_A (80% saturation > 75% threshold) → should migrate to POOL_B
        const result = selectBestCardanoPool(pools, POOL_A);
        expect(result?.bech32).toEqual(POOL_B);
    });

    it('selects best pool when current pool is not in the list', () => {
        const pools = [
            { id: POOL_A, saturation: 50, apy: 4.2 },
            { id: POOL_B, saturation: 30, apy: 4.3 },
        ];

        // User's pool is unknown (not in list) → fall back to best pool
        const result = selectBestCardanoPool(pools, 'pool1unknown');
        expect(result?.bech32).toEqual(POOL_A);
    });

    it('falls back to the least saturated pool when all pools are oversaturated', () => {
        const pools = [
            { id: POOL_A, saturation: 80, apy: 4.2 },
            { id: POOL_B, saturation: 90, apy: 4.3 },
        ];

        // All pools above threshold → pick least saturated
        const result = selectBestCardanoPool(pools);
        expect(result?.bech32).toEqual(POOL_A);
    });

    it('falls back to least saturated pool when current pool is oversaturated and all others are too', () => {
        const pools = [
            { id: POOL_A, saturation: 80, apy: 4.2 },
            { id: POOL_B, saturation: 90, apy: 4.3 },
        ];

        // Current pool is POOL_A (oversaturated), all pools oversaturated → pick least saturated (POOL_A)
        const result = selectBestCardanoPool(pools, POOL_A);
        expect(result?.bech32).toEqual(POOL_A);
    });
});
