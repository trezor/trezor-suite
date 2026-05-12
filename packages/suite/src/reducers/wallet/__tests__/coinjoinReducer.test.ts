import type { AccountKey } from '@suite-common/wallet-types';

import type { Action } from 'src/types/suite';

import { actionFixtures, selectorFixtures } from '../__fixtures__/coinjoinReducer';
import {
    type CoinjoinRootState,
    type CoinjoinState,
    coinjoinReducer,
    initialState,
    selectCoinjoinAccountByKey,
    selectRegisteredUtxosByAccountKey,
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
