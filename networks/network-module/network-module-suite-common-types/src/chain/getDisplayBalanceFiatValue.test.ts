import { getDisplayBalanceFiatValue } from './getDisplayBalanceFiatValue';

describe('getDisplayBalanceFiatValue', () => {
    it('values the displayed balance at the rate without rounding', () => {
        expect(
            getDisplayBalanceFiatValue({
                balance: {
                    balance: '2',
                    availableBalance: '1.5',
                    displayBalance: '1.5',
                    empty: false,
                },
                rate: { rate: 1234.567, timestamp: 0 },
            }),
        ).toBe('1851.8505');
    });
});
