import type { AccountKey } from '@suite-common/wallet-types';

import { DEFAULT_TARGET_ANONYMITY } from 'src/services/coinjoin/config';
import type { Action } from 'src/types/suite';

import { actionFixtures, selectorFixtures } from '../__fixtures__/coinjoinReducer';
import {
    type CoinjoinRootState,
    type CoinjoinState,
    coinjoinReducer,
    initialState,
    selectCoinjoinAccountByKey,
    selectCoinjoinClient,
    selectDefaultMaxMiningFeeByAccountKey,
    selectFeeRateMedianByAccountKey,
    selectMinAllowedInputWithFee,
    selectRegisteredUtxosByAccountKey,
    selectTargetAnonymityByAccountKey,
} from '../coinjoinReducer';

describe('Coinjoin reducer actions', () => {
    actionFixtures.forEach(f => {
        it(f.description, () => {
            let state = f.initialState as unknown as CoinjoinState;
            f.actions.forEach(a => {
                state = coinjoinReducer(state, a as Action);
            });
            expect(state).toEqual(f.result);
        });
    });
});

describe('Coinjoin reducer selectors', () => {
    const selectors = { selectRegisteredUtxosByAccountKey };

    selectorFixtures.forEach(f => {
        it(`${f.selector}: ${f.description}`, () => {
            const state = {
                suite: {},
                wallet: {
                    accounts: [],
                    selectedAccount: {},
                    coinjoin: f.initialState,
                },
            } as unknown as CoinjoinRootState;

            const selectorFn = selectors[f.selector];
            const args = [state, ...f.selectorArgs] as unknown as Parameters<typeof selectorFn>;

            const result = selectorFn(...args);
            expect(result).toEqual(f.result);
        });
    });
});

describe('selectCoinjoinAccountByKey', () => {
    const accountA = { key: 'A' as AccountKey, symbol: 'btc' };
    const accountB = { key: 'B' as AccountKey, symbol: 'btc' };

    const buildState = (accounts: unknown[]) =>
        ({
            wallet: {
                coinjoin: { ...initialState, accounts },
            },
        }) as unknown as CoinjoinRootState;

    it('returns the matched coinjoin account', () => {
        const state = buildState([accountA, accountB]);

        expect(selectCoinjoinAccountByKey(state, 'A' as AccountKey)).toBe(accountA);
    });

    it('returns undefined for a missing accountKey', () => {
        const state = buildState([accountA]);

        expect(selectCoinjoinAccountByKey(state, 'Z' as AccountKey)).toBeUndefined();
    });

    it('returns undefined when accountKey is null', () => {
        const state = buildState([accountA]);

        expect(selectCoinjoinAccountByKey(state, null)).toBeUndefined();
    });

    it('returns the same reference on repeated calls with the same accountKey and accounts ref', () => {
        const state = buildState([accountA, accountB]);

        expect(selectCoinjoinAccountByKey(state, 'A' as AccountKey)).toBe(
            selectCoinjoinAccountByKey(state, 'A' as AccountKey),
        );
    });

    it('caches distinct accountKey lookups independently against the same accounts ref', () => {
        const state = buildState([accountA, accountB]);

        const a1 = selectCoinjoinAccountByKey(state, 'A' as AccountKey);
        const b1 = selectCoinjoinAccountByKey(state, 'B' as AccountKey);
        const a2 = selectCoinjoinAccountByKey(state, 'A' as AccountKey);
        const b2 = selectCoinjoinAccountByKey(state, 'B' as AccountKey);

        expect(a1).toBe(accountA);
        expect(b1).toBe(accountB);
        expect(a2).toBe(a1);
        expect(b2).toBe(b1);
    });
});

describe('selectCoinjoinClient', () => {
    const btcClient = { feeRateMedian: 12, status: 'available' };
    const accountA = { key: 'A' as AccountKey, symbol: 'btc' };
    const accountB = { key: 'B' as AccountKey, symbol: 'btc' };

    const buildState = (accounts: unknown[], clients: Record<string, unknown> = {}) =>
        ({
            wallet: {
                coinjoin: { ...initialState, accounts, clients },
            },
        }) as unknown as CoinjoinRootState;

    it('returns the client matching the account symbol', () => {
        const state = buildState([accountA], { btc: btcClient });

        expect(selectCoinjoinClient(state, 'A' as AccountKey)).toBe(btcClient);
    });

    it('returns undefined when accountKey does not match any account', () => {
        const state = buildState([accountA], { btc: btcClient });

        expect(selectCoinjoinClient(state, 'Z' as AccountKey)).toBeUndefined();
    });

    it('returns undefined when accountKey is null', () => {
        const state = buildState([accountA], { btc: btcClient });

        expect(selectCoinjoinClient(state, null)).toBeUndefined();
    });

    it('returns undefined when no client is registered for the account symbol', () => {
        const state = buildState([accountA], {});

        expect(selectCoinjoinClient(state, 'A' as AccountKey)).toBeUndefined();
    });

    it('returns the same reference on repeated calls with the same args', () => {
        const state = buildState([accountA], { btc: btcClient });

        expect(selectCoinjoinClient(state, 'A' as AccountKey)).toBe(
            selectCoinjoinClient(state, 'A' as AccountKey),
        );
    });

    it('caches distinct accountKey lookups independently against the same accounts/clients refs', () => {
        const state = buildState([accountA, accountB], { btc: btcClient });

        const a1 = selectCoinjoinClient(state, 'A' as AccountKey);
        const b1 = selectCoinjoinClient(state, 'B' as AccountKey);
        const a2 = selectCoinjoinClient(state, 'A' as AccountKey);
        const b2 = selectCoinjoinClient(state, 'B' as AccountKey);

        expect(a1).toBe(btcClient);
        expect(b1).toBe(btcClient);
        expect(a2).toBe(a1);
        expect(b2).toBe(b1);
    });
});

describe('selectMinAllowedInputWithFee', () => {
    const accountA = { key: 'A' as AccountKey, symbol: 'btc' };
    const btcClient = {
        feeRateMedian: 5,
        allowedInputAmounts: { min: 5000, max: 1_000_000 },
    };

    const buildState = (accounts: unknown[], clients: Record<string, unknown> = {}) =>
        ({
            wallet: {
                coinjoin: { ...initialState, accounts, clients },
            },
        }) as unknown as CoinjoinRootState;

    it('computes minAllowedInput + taprootTxSize * feeRateMedian for a registered client', () => {
        // TAPROOT_TX_SIZE = getInputSize('Taproot') + getOutputSize('Taproot') = 58 + 43 = 101
        // 5000 + 101 * 5 = 5505
        const state = buildState([accountA], { btc: btcClient });

        expect(selectMinAllowedInputWithFee(state, 'A' as AccountKey)).toBe(5505);
    });

    it('falls back to CLIENT_STATUS_FALLBACK when no client is registered for the account', () => {
        const state = buildState([accountA], {});

        const result = selectMinAllowedInputWithFee(state, 'A' as AccountKey);
        expect(typeof result).toBe('number');
        expect(Number.isFinite(result)).toBe(true);
    });

    it('returns the same number across repeated calls with the same args', () => {
        const state = buildState([accountA], { btc: btcClient });

        const first = selectMinAllowedInputWithFee(state, 'A' as AccountKey);
        const second = selectMinAllowedInputWithFee(state, 'A' as AccountKey);

        expect(second).toBe(first);
    });

    it('returns a different number when client feeRateMedian changes', () => {
        const stateBefore = buildState([accountA], { btc: btcClient });
        const stateAfter = buildState([accountA], {
            btc: { ...btcClient, feeRateMedian: 10 },
        });

        const before = selectMinAllowedInputWithFee(stateBefore, 'A' as AccountKey);
        const after = selectMinAllowedInputWithFee(stateAfter, 'A' as AccountKey);

        expect(before).toBe(5505);
        // 5000 + 101 * 10 = 6010
        expect(after).toBe(6010);
    });
});

describe('selectTargetAnonymityByAccountKey', () => {
    const accountWithSetup = {
        key: 'A' as AccountKey,
        symbol: 'btc',
        setup: { targetAnonymity: 42 },
    };
    const accountWithoutSetup = { key: 'B' as AccountKey, symbol: 'btc' };
    const accountWithEmptySetup = { key: 'C' as AccountKey, symbol: 'btc', setup: {} };

    const buildState = (accounts: unknown[]) =>
        ({
            wallet: {
                coinjoin: { ...initialState, accounts },
            },
        }) as unknown as CoinjoinRootState;

    it('returns the configured targetAnonymity when present', () => {
        const state = buildState([accountWithSetup]);

        expect(selectTargetAnonymityByAccountKey(state, 'A' as AccountKey)).toBe(42);
    });

    it('returns DEFAULT_TARGET_ANONYMITY when account exists but setup.targetAnonymity is missing', () => {
        const state = buildState([accountWithoutSetup, accountWithEmptySetup]);

        expect(selectTargetAnonymityByAccountKey(state, 'B' as AccountKey)).toBe(
            DEFAULT_TARGET_ANONYMITY,
        );
        expect(selectTargetAnonymityByAccountKey(state, 'C' as AccountKey)).toBe(
            DEFAULT_TARGET_ANONYMITY,
        );
    });

    it('returns undefined when accountKey does not match any account', () => {
        const state = buildState([accountWithSetup]);

        expect(selectTargetAnonymityByAccountKey(state, 'Z' as AccountKey)).toBeUndefined();
    });

    it('returns undefined when accountKey is null', () => {
        const state = buildState([accountWithSetup]);

        expect(selectTargetAnonymityByAccountKey(state, null)).toBeUndefined();
    });

    it('returns the same primitive across repeated calls with the same args', () => {
        const state = buildState([accountWithSetup]);

        const first = selectTargetAnonymityByAccountKey(state, 'A' as AccountKey);
        const second = selectTargetAnonymityByAccountKey(state, 'A' as AccountKey);

        expect(first).toBe(42);
        expect(second).toBe(first);
    });

    it('caches distinct accountKey lookups independently against the same accounts ref', () => {
        const state = buildState([accountWithSetup, accountWithoutSetup]);

        const a1 = selectTargetAnonymityByAccountKey(state, 'A' as AccountKey);
        const b1 = selectTargetAnonymityByAccountKey(state, 'B' as AccountKey);
        const a2 = selectTargetAnonymityByAccountKey(state, 'A' as AccountKey);
        const b2 = selectTargetAnonymityByAccountKey(state, 'B' as AccountKey);

        expect(a1).toBe(42);
        expect(b1).toBe(DEFAULT_TARGET_ANONYMITY);
        expect(a2).toBe(a1);
        expect(b2).toBe(b1);
    });
});

describe('selectFeeRateMedianByAccountKey', () => {
    const accountA = { key: 'A' as AccountKey, symbol: 'btc' };
    const btcClient = { feeRateMedian: 7, allowedInputAmounts: { min: 5000, max: 1_000_000 } };

    const buildState = (accounts: unknown[], clients: Record<string, unknown> = {}) =>
        ({
            wallet: {
                coinjoin: { ...initialState, accounts, clients },
            },
        }) as unknown as CoinjoinRootState;

    it('returns the registered client feeRateMedian for the account', () => {
        const state = buildState([accountA], { btc: btcClient });

        expect(selectFeeRateMedianByAccountKey(state, 'A' as AccountKey)).toBe(7);
    });

    it('falls back to FEE_RATE_MEDIAN_FALLBACK when no client is registered for the account', () => {
        const state = buildState([accountA], {});

        // FEE_RATE_MEDIAN_FALLBACK = 2
        expect(selectFeeRateMedianByAccountKey(state, 'A' as AccountKey)).toBe(2);
    });

    it('falls back to FEE_RATE_MEDIAN_FALLBACK when client feeRateMedian is 0', () => {
        const state = buildState([accountA], {
            btc: { ...btcClient, feeRateMedian: 0 },
        });

        expect(selectFeeRateMedianByAccountKey(state, 'A' as AccountKey)).toBe(2);
    });

    it('returns the same number across repeated calls with the same args', () => {
        const state = buildState([accountA], { btc: btcClient });

        const first = selectFeeRateMedianByAccountKey(state, 'A' as AccountKey);
        const second = selectFeeRateMedianByAccountKey(state, 'A' as AccountKey);

        expect(second).toBe(first);
    });

    it('recomputes when client feeRateMedian changes', () => {
        const stateBefore = buildState([accountA], { btc: btcClient });
        const stateAfter = buildState([accountA], {
            btc: { ...btcClient, feeRateMedian: 11 },
        });

        expect(selectFeeRateMedianByAccountKey(stateBefore, 'A' as AccountKey)).toBe(7);
        expect(selectFeeRateMedianByAccountKey(stateAfter, 'A' as AccountKey)).toBe(11);
    });
});

describe('selectDefaultMaxMiningFeeByAccountKey', () => {
    const accountA = { key: 'A' as AccountKey, symbol: 'btc' };
    const btcClient = { feeRateMedian: 7, allowedInputAmounts: { min: 5000, max: 1_000_000 } };

    const buildState = (
        accounts: unknown[],
        clients: Record<string, unknown> = {},
        maxFeePerVbyte: number | undefined = undefined,
    ) =>
        ({
            wallet: {
                coinjoin: {
                    ...initialState,
                    accounts,
                    clients,
                    config: { ...initialState.config, maxFeePerVbyte },
                },
            },
        }) as unknown as CoinjoinRootState;

    it('returns getMaxFeePerVbyte(feeRateMedian, maxMiningFeeModifier) when no config override', () => {
        const state = buildState([accountA], { btc: btcClient });

        // MAX_MINING_FEE_MODIFIER = 2.5, Math.round(7 * 2.5) = 18
        expect(selectDefaultMaxMiningFeeByAccountKey(state, 'A' as AccountKey)).toBe(18);
    });

    it('returns the config override when maxFeePerVbyte is set in config', () => {
        const state = buildState([accountA], { btc: btcClient }, 42);

        expect(selectDefaultMaxMiningFeeByAccountKey(state, 'A' as AccountKey)).toBe(42);
    });

    it('uses FEE_RATE_MEDIAN_FALLBACK when no client is registered', () => {
        const state = buildState([accountA], {});

        // Math.round(2 * 2.5) = 5
        expect(selectDefaultMaxMiningFeeByAccountKey(state, 'A' as AccountKey)).toBe(5);
    });

    it('returns the same number across repeated calls with the same args', () => {
        const state = buildState([accountA], { btc: btcClient });

        const first = selectDefaultMaxMiningFeeByAccountKey(state, 'A' as AccountKey);
        const second = selectDefaultMaxMiningFeeByAccountKey(state, 'A' as AccountKey);

        expect(second).toBe(first);
    });

    it('recomputes when client feeRateMedian changes', () => {
        const stateBefore = buildState([accountA], { btc: btcClient });
        const stateAfter = buildState([accountA], {
            btc: { ...btcClient, feeRateMedian: 10 },
        });

        expect(selectDefaultMaxMiningFeeByAccountKey(stateBefore, 'A' as AccountKey)).toBe(18);
        // Math.round(10 * 2.5) = 25
        expect(selectDefaultMaxMiningFeeByAccountKey(stateAfter, 'A' as AccountKey)).toBe(25);
    });
});
