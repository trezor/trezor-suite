import { z } from 'zod';

import { getSlippageFormValidationSchema } from './slippageFormValidationSchema';

const messages = {
    required: 'REQUIRED',
    notNumber: 'NOT_NUMBER',
    outOfRange: 'OUT_OF_RANGE',
};

const schema = z.object({ slippage: getSlippageFormValidationSchema(messages) });

const validate = (slippage: string) => schema.safeParse({ slippage }).error?.issues[0]?.message;

describe('getSlippageFormValidationSchema', () => {
    it('rejects an empty value as required', () => {
        expect(validate('')).toBe('REQUIRED');
    });

    it('rejects a non-numeric value', () => {
        expect(validate('abc')).toBe('NOT_NUMBER');
    });

    it('rejects a value below the minimum', () => {
        expect(validate('0')).toBe('OUT_OF_RANGE');
        expect(validate('0.005')).toBe('OUT_OF_RANGE');
    });

    it('rejects a value above the maximum', () => {
        expect(validate('50.1')).toBe('OUT_OF_RANGE');
    });

    it('accepts the inclusive boundaries', () => {
        expect(validate('0.01')).toBeUndefined();
        expect(validate('50')).toBeUndefined();
    });

    it('accepts a value within the range', () => {
        expect(validate('1')).toBeUndefined();
        expect(validate('3')).toBeUndefined();
    });
});
