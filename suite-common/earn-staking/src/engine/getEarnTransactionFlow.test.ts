import { getEarnTransactionFlow } from './getEarnTransactionFlow';

describe('getEarnTransactionFlow', () => {
    it.each([
        ['stake', 'stake'],
        ['unstake', 'unstake'],
        ['withdraw', 'withdraw'],
        ['claim', 'claim'],
        ['vote', 'vote'],
        ['redelegate', 'vote'],
    ] as const)('reports %s as the %s flow', (operation, flow) => {
        expect(getEarnTransactionFlow(operation)).toBe(flow);
    });
});
