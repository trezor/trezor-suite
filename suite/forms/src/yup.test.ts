import { yup } from './yup';

const getErrorMessage = (schema: yup.Schema, value: unknown) => {
    try {
        schema.validateSync(value);

        return undefined;
    } catch (error) {
        return error instanceof yup.ValidationError ? error.message : undefined;
    }
};

describe('yup', () => {
    it('uses translation keys for default locale messages', () => {
        expect(getErrorMessage(yup.string().max(1), 'ab')).toBe('TR_EXCEEDS_MAX');
        expect(getErrorMessage(yup.string().required(), undefined)).toBe('TR_REQUIRED_FIELD');
    });

    it('validates ascii strings', () => {
        expect(getErrorMessage(yup.string().isAscii(), 'abc')).toBeUndefined();
        expect(getErrorMessage(yup.string().isAscii(), 'čšř')).toBe('TR_ASCII_ONLY');
    });

    it('validates hex strings', () => {
        expect(getErrorMessage(yup.string().isHex(), '0xdeadbeef')).toBeUndefined();
        expect(getErrorMessage(yup.string().isHex(), 'deadbeef')).toBeUndefined();
        expect(getErrorMessage(yup.string().isHex(), 'xyz')).toBe('DATA_NOT_VALID_HEX');
        expect(getErrorMessage(yup.string().isHex(), '')).toBe('DATA_NOT_VALID_HEX');
    });
});
