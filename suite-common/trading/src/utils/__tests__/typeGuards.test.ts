import { isSendRejectedError } from '../typeGuards';

describe('typeGuards', () => {
    describe('isSendRejectedError', () => {
        it('returns true for valid trading send rejected error', () => {
            expect(
                isSendRejectedError({
                    type: 'error',
                    error: {
                        id: 'TR_GENERIC_ERROR',
                        values: { foo: 'bar' },
                    },
                }),
            ).toBe(true);
        });

        it('returns true for valid error without values', () => {
            expect(
                isSendRejectedError({
                    type: 'sign-transaction-timeout',
                    error: {
                        id: 'TR_TIMEOUT',
                    },
                }),
            ).toBe(true);
        });

        it('returns false for invalid shape', () => {
            expect(isSendRejectedError(undefined)).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'error',
                }),
            ).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'invalid-type',
                    error: {
                        id: 'TR_GENERIC_ERROR',
                    },
                }),
            ).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'error',
                    error: {
                        id: 123,
                    },
                }),
            ).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'error',
                    error: {
                        id: 'TR_GENERIC_ERROR',
                        values: 'invalid',
                    },
                }),
            ).toBe(false);
        });
    });
});
