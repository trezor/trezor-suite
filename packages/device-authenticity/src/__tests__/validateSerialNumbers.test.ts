import type { VerifyAuthenticityProofResult } from '../types';
import { validateSerialNumbers } from '../validateSerialNumbers';

describe(validateSerialNumbers.name, () => {
    const createValidResult = (
        serialNumber: string | undefined,
    ): VerifyAuthenticityProofResult => ({
        valid: true,
        rootPubKey: 'test-root-pubkey',
        serialNumber,
    });

    const createInvalidResult = (): VerifyAuthenticityProofResult => ({
        valid: false,
        error: 'ROOT_PUBKEY_NOT_FOUND' as const,
    });

    describe('when all results have valid: false', () => {
        it('returns all results as-is', () => {
            const optigaResult = createInvalidResult();
            const tropicResult = createInvalidResult();
            const mcuResult = createInvalidResult();

            const results = { optigaResult, tropicResult, mcuResult };
            expect(validateSerialNumbers(results)).toEqual(results);
        });
    });

    describe('when some results are null', () => {
        it('returns all results as-is when only optiga is defined', () => {
            const optigaResult = createValidResult('1234567890abcdef');

            const results = { optigaResult, tropicResult: null, mcuResult: null };
            expect(validateSerialNumbers(results)).toEqual(results);
        });

        it('returns all results as-is when optiga and tropic are defined', () => {
            const optigaResult = createValidResult('1234567890abcdef');
            const tropicResult = createValidResult('1234567890abcdef');

            const results = { optigaResult, tropicResult, mcuResult: null };
            expect(validateSerialNumbers(results)).toEqual(results);
        });
    });

    describe('when any result has valid: false', () => {
        it('returns all results as-is when tropic is invalid', () => {
            const optigaResult = createValidResult('1234567890abcdef');
            const tropicResult = createInvalidResult();
            const mcuResult = createValidResult('1234567890abcdef');

            const results = { optigaResult, tropicResult, mcuResult };
            expect(validateSerialNumbers(results)).toEqual(results);
        });
        it('returns all results as-is when mcu is invalid', () => {
            const optigaResult = createValidResult('1234567890abcdef');
            const tropicResult = createValidResult('1234567890abcdef');
            const mcuResult = createInvalidResult();

            const results = { optigaResult, tropicResult, mcuResult };
            expect(validateSerialNumbers(results)).toEqual(results);
        });
        it('returns all results as-is when both tropic and optiga are invalid', () => {
            const optigaResult = createInvalidResult();
            const tropicResult = createInvalidResult();
            const mcuResult = createValidResult('1234567890abcdef');

            const results = { optigaResult, tropicResult, mcuResult };
            expect(validateSerialNumbers(results)).toEqual(results);
        });
    });

    describe('when a valid result is missing serialNumber', () => {
        it('returns all results with valid: false and SERIAL_NUMBER_MISMATCH error', () => {
            const optigaResult = createValidResult(undefined);
            const tropicResult = createValidResult('1234567890abcdef');
            const mcuResult = createValidResult('1234567890abcdef');

            const results = { optigaResult, tropicResult, mcuResult };
            const validated = validateSerialNumbers(results);

            expect(validated).toEqual({
                optigaResult: { ...optigaResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                tropicResult: { ...tropicResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                mcuResult: { ...mcuResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
            });
        });

        it('handles empty string serial numbers', () => {
            const optigaResult = createValidResult('1234567890abcdef');
            const tropicResult = createValidResult('');

            const results = { optigaResult, tropicResult, mcuResult: null };
            const validated = validateSerialNumbers(results);

            expect(validated).toEqual({
                optigaResult: { ...optigaResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                tropicResult: { ...tropicResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                mcuResult: null,
            });
        });
    });

    describe('when serial numbers do not match', () => {
        it('returns all results with valid: false and SERIAL_NUMBER_MISMATCH error', () => {
            const optigaResult = createValidResult('1111111111111111');
            const tropicResult = createValidResult('2222222222222222');
            const mcuResult = createValidResult('1111111111111111');

            const results = { optigaResult, tropicResult, mcuResult };
            const validated = validateSerialNumbers(results);

            expect(validated).toEqual({
                optigaResult: { ...optigaResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                tropicResult: { ...tropicResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                mcuResult: { ...mcuResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
            });
        });

        it('returns all results with valid: false when optiga and tropic differ', () => {
            const optigaResult = createValidResult('aaaaaaaaaaaaaaaa');
            const tropicResult = createValidResult('bbbbbbbbbbbbbbbb');

            const results = { optigaResult, tropicResult, mcuResult: null };
            const validated = validateSerialNumbers(results);

            expect(validated).toEqual({
                optigaResult: { ...optigaResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                tropicResult: { ...tropicResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' },
                mcuResult: null,
            });
        });
    });

    describe('when all serial numbers match', () => {
        it('returns all results unchanged', () => {
            const optigaResult = createValidResult('1234567890abcdef');
            const tropicResult = createValidResult('1234567890abcdef');
            const mcuResult = createValidResult('1234567890abcdef');

            const results = { optigaResult, tropicResult, mcuResult };
            expect(validateSerialNumbers(results)).toEqual(results);
        });

        it('returns optiga and tropic results unchanged when mcu is null', () => {
            const optigaResult = createValidResult('fedcba0987654321');
            const tropicResult = createValidResult('fedcba0987654321');

            const results = { optigaResult, tropicResult, mcuResult: null };
            expect(validateSerialNumbers(results)).toEqual(results);
        });
    });
});
