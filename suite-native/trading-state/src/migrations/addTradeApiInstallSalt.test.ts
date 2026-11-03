import { migrateTradingAddTradeApiInstallSalt } from './addTradeApiInstallSalt';

describe('migrateTradingAddTradeApiInstallSalt', () => {
    const persist = { version: 4, rehydrated: true };

    it('returns undefined when there is no stored state', () => {
        expect(migrateTradingAddTradeApiInstallSalt(undefined)).toBeUndefined();
    });

    it('adds a random install salt to a stored state without one', () => {
        const oldState = { trades: [], _persist: persist };

        expect(migrateTradingAddTradeApiInstallSalt(oldState)).toEqual({
            ...oldState,
            tradeApiInstallSalt: expect.stringMatching(/^[0-9a-f]{64}$/),
        });
    });

    it('keeps an existing install salt', () => {
        const oldState = { trades: [], tradeApiInstallSalt: 'ab'.repeat(32), _persist: persist };

        expect(migrateTradingAddTradeApiInstallSalt(oldState)).toBe(oldState);
    });
});
