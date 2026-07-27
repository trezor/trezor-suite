import { yup } from '@suite-common/validators';

import { getSlippageFormValidationSchema } from '../slippageFormValidationSchema';

const messages = {
    required: 'REQUIRED',
    notNumber: 'NOT_NUMBER',
    outOfRange: 'OUT_OF_RANGE',
};

const schema = yup.object({ slippage: getSlippageFormValidationSchema(messages) });

const validate = (slippage: string) =>
    schema.validate({ slippage }).then(
        () => undefined,
        error => error.message,
    );

describe('getSlippageFormValidationSchema', () => {
    it('rejects an empty value as required', async () => {
        expect(await validate('')).toBe('REQUIRED');
    });

    it('rejects a non-numeric value', async () => {
        expect(await validate('abc')).toBe('NOT_NUMBER');
    });

    it('rejects a value below the minimum', async () => {
        expect(await validate('0')).toBe('OUT_OF_RANGE');
        expect(await validate('0.005')).toBe('OUT_OF_RANGE');
    });

    it('rejects a value above the maximum', async () => {
        expect(await validate('50.1')).toBe('OUT_OF_RANGE');
    });

    it('accepts the inclusive boundaries', async () => {
        expect(await validate('0.01')).toBeUndefined();
        expect(await validate('50')).toBeUndefined();
    });

    it('accepts a value within the range', async () => {
        expect(await validate('1')).toBeUndefined();
        expect(await validate('3')).toBeUndefined();
    });
});
