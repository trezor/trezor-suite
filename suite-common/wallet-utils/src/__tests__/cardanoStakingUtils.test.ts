import { CARDANO_EVERSTAKE_STAKING_POOL, EVERSTAKE_POOLS } from '@suite-common/wallet-constants';

import { selectBestCardanoPool } from '../cardanoStakingUtils';

const POOL_A = EVERSTAKE_POOLS[0]; // pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn
const POOL_B = EVERSTAKE_POOLS[1]; // pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj

describe('selectBestCardanoPool', () => {
    it('returns fallback pool when no pools are provided', () => {
        expect(selectBestCardanoPool()).toEqual(CARDANO_EVERSTAKE_STAKING_POOL);
        expect(selectBestCardanoPool([])).toEqual(CARDANO_EVERSTAKE_STAKING_POOL);
    });

    it('returns the best (most saturated below 75% threshold) pool when no current pool is given', () => {
        const pools = [
            { id: POOL_A, saturation: 50, apy: 4.2 },
            { id: POOL_B, saturation: 30, apy: 4.3 },
        ];

        // Sorts highest to lowest saturation, picks first below 75% → POOL_A (50%)
        const result = selectBestCardanoPool(pools);
        expect(result?.bech32).toEqual(POOL_A);
    });

    it("keeps the user's current pool when it is below the 75% threshold", () => {
        const pools = [
            { id: POOL_A, saturation: 50, apy: 4.2 },
            { id: POOL_B, saturation: 30, apy: 4.3 },
        ];

        // User is in POOL_B (30% saturation < 95% migration threshold) → should stay in POOL_B
        const result = selectBestCardanoPool(pools, POOL_B);
        expect(result?.bech32).toEqual(POOL_B);
    });

    it("keeps the user's current pool when it is saturated but below 95%", () => {
        const pools = [
            { id: POOL_A, saturation: 80, apy: 4.2 }, // above 75% safe threshold but below 95% migration threshold
            { id: POOL_B, saturation: 30, apy: 4.3 },
        ];

        // User is in POOL_A (80% saturation < 95% threshold) → should stay in POOL_A
        const result = selectBestCardanoPool(pools, POOL_A);
        expect(result?.bech32).toEqual(POOL_A);
    });

    it('migrates the user only when their current pool exceeds 95% saturation', () => {
        const pools = [
            { id: POOL_A, saturation: 96, apy: 4.2 }, // critically oversaturated (> 95%)
            { id: POOL_B, saturation: 30, apy: 4.3 }, // healthy
        ];

        // User is in POOL_A (96% saturation ≥ 95% threshold) → should migrate to POOL_B
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

    it('falls back to the least saturated pool when all pools are above 75% and no current pool', () => {
        const pools = [
            { id: POOL_A, saturation: 80, apy: 4.2 },
            { id: POOL_B, saturation: 90, apy: 4.3 },
        ];

        // All pools above 75% threshold and no current pool → pick least saturated
        const result = selectBestCardanoPool(pools);
        expect(result?.bech32).toEqual(POOL_A);
    });

    it('falls back to least saturated pool when current pool exceeds 95% and all others are above 75% too', () => {
        const pools = [
            { id: POOL_A, saturation: 96, apy: 4.2 },
            { id: POOL_B, saturation: 90, apy: 4.3 },
        ];

        // Current pool POOL_A is critically oversaturated (96%), all above 75% → pick least saturated (POOL_B)
        const result = selectBestCardanoPool(pools, POOL_A);
        expect(result?.bech32).toEqual(POOL_B);
    });
});
