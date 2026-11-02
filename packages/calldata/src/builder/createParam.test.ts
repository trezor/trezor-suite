import { createParam } from './createParam';

describe('createParam', () => {
    it('calls validate and policy, returns combined result', () => {
        const validate = jest.fn().mockReturnValue({
            value: 'NORMALIZED',
            issues: [{ code: 'ZERO_ADDRESS', path: 'to' }],
        });
        const policy = jest.fn().mockReturnValue({
            issues: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            errors: [],
            warnings: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            isValid: true,
        });

        const param = createParam({ validate, policy });
        const result = param('input', 'to', undefined);

        expect(validate).toHaveBeenCalledWith('input', 'to', undefined);
        expect(policy).toHaveBeenCalledWith([{ code: 'ZERO_ADDRESS', path: 'to' }]);
        expect(result).toEqual({
            value: 'NORMALIZED',
            issues: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            errors: [],
            warnings: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            isValid: true,
        });
    });

    it('uses default policy when none provided', () => {
        const validate = jest.fn().mockReturnValue({
            value: null,
            issues: [{ code: 'INVALID_ADDRESS', path: 'to' }],
        });

        const param = createParam({ validate });
        const result = param('input', 'to', undefined);

        expect(result.isValid).toBe(false);
        expect(result.issues).toEqual([{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }]);
        expect(result.errors).toEqual([{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }]);
        expect(result.warnings).toEqual([]);
    });

    it('passes context to validate', () => {
        const validate = jest.fn().mockReturnValue({
            value: 'NORMALIZED',
            issues: [],
        });
        const context = { sender: '0xabc', balance: 1000n };

        const param = createParam({ validate });
        param('input', 'to', context);

        expect(validate).toHaveBeenCalledWith('input', 'to', context);
    });
});
