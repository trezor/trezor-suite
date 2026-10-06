import { measurementKey, resolveBudget } from './measurement';

describe(measurementKey.name, () => {
    it('names a measurement by the scenario and the model it ran on', () => {
        expect(measurementKey('wallet-discovery', 'T3W1')).toBe('wallet-discovery [T3W1]');
    });

    it('is the scenario alone where there is no model to distinguish', () => {
        expect(measurementKey('wallet-discovery', '')).toBe('wallet-discovery');
    });
});

describe(resolveBudget.name, () => {
    const budgets = {
        'wallet-discovery': { totalBlockingTimeMs: 2000 },
        'wallet-discovery [T3T1]': { totalBlockingTimeMs: 3000 },
    };

    it('prefers the budget of the model the scenario was measured on', () => {
        expect(resolveBudget(budgets, 'wallet-discovery', 'T3T1')).toEqual({
            totalBlockingTimeMs: 3000,
        });
    });

    it('falls back to the scenario-wide budget for a model without one of its own', () => {
        expect(resolveBudget(budgets, 'wallet-discovery', 'T3W1')).toEqual({
            totalBlockingTimeMs: 2000,
        });
    });

    it('is undefined for a scenario with no budget at all', () => {
        expect(resolveBudget(budgets, 'account-switch', 'T3W1')).toBeUndefined();
    });
});
