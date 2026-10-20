import { toFunctionSelector } from 'viem';

import { EVERSTAKE_ABI } from './abi';
import { EVERSTAKE_SELECTORS, getEverstakeOperationBySelector } from './selectors';

describe('EVERSTAKE_SELECTORS', () => {
    it.each(Object.entries(EVERSTAKE_SELECTORS))(
        'matches the selector derived from the %s ABI',
        (operation, selector) => {
            const [fn] = EVERSTAKE_ABI[operation as keyof typeof EVERSTAKE_SELECTORS];

            expect(toFunctionSelector(fn)).toBe(selector);
        },
    );
});

describe(getEverstakeOperationBySelector.name, () => {
    it('maps each selector to its operation regardless of case', () => {
        expect(getEverstakeOperationBySelector('0x3a29dbae')).toBe('stake');
        expect(getEverstakeOperationBySelector('0x76EC871C')).toBe('unstake');
        expect(getEverstakeOperationBySelector('0x33986ffa')).toBe('claimWithdrawRequest');
    });

    it('returns null for an unknown or missing selector', () => {
        expect(getEverstakeOperationBySelector('0xa9059cbb')).toBeNull();
        expect(getEverstakeOperationBySelector(undefined)).toBeNull();
    });
});
