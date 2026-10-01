import { type FiatGraphPoint } from '@suite-common/graph';

import { getExtremaFromGraphPoints, getGraphError, omitErrorMessageSensitiveData } from './utils';

describe('Suite native graph utils', () => {
    test('getExtremaFromGraphPoints', () => {
        const graphPoints: FiatGraphPoint[] = [
            {
                value: 0,
                date: new Date(0),
            },
            {
                value: 2,
                date: new Date(1),
            },
            {
                value: 6,
                date: new Date(2),
            },
            {
                value: 0,
                date: new Date(3),
            },
            {
                value: 2,
                date: new Date(4),
            },
            {
                value: 1,
                date: new Date(5),
            },
        ];

        const extremaFromPoints = getExtremaFromGraphPoints(graphPoints)!;

        expect(extremaFromPoints.max.value).toEqual(6);
        expect(Math.floor(extremaFromPoints.max.x)).toEqual(42);

        expect(extremaFromPoints.min.value).toEqual(0);
        expect(Math.floor(extremaFromPoints.min.x)).toEqual(14);
    });
});

describe('omitErrorMessageSensitiveData', () => {
    it('should redact account not found message', () => {
        const input = 'Account not found: xpub1234567890';
        const expected = 'Account not found: [SENSITIVE DATA HIDDEN]';
        expect(omitErrorMessageSensitiveData(input)).toBe(expected);
    });

    it('should redact fiat rates error message', () => {
        const input = 'Unable to fetch fiat rates for defined timestamps. Some sensitive data here';
        const expected =
            'Unable to fetch fiat rates for defined timestamps. [SENSITIVE DATA HIDDEN]';
        expect(omitErrorMessageSensitiveData(input)).toBe(expected);
    });

    it('should redact timeout error message', () => {
        const input = 'Aborted by timeout - some sensitive details';
        const expected = 'Aborted by timeout - [SENSITIVE DATA HIDDEN]';
        expect(omitErrorMessageSensitiveData(input)).toBe(expected);
    });

    it('should redact transaction indexing message with end delimiter', () => {
        const input = 'getTransaction 0x123 not found (transaction indexing still in progress)';
        const expected =
            'getTransaction [SENSITIVE DATA HIDDEN] not found (transaction indexing still in progress)';
        expect(omitErrorMessageSensitiveData(input)).toBe(expected);
    });

    it('should redact Ethereum balance error with context deadline', () => {
        const input = 'EthereumTypeGetBalance some sensitive data context deadline exceeded';
        const expected = 'EthereumTypeGetBalance [SENSITIVE DATA HIDDEN] context deadline exceeded';
        expect(omitErrorMessageSensitiveData(input)).toBe(expected);
    });

    it('should handle multiple redactions in the same string', () => {
        const input =
            'Account not found: xpub123. Unable to fetch fiat rates for defined timestamps. More data';
        const expected = 'Account not found: [SENSITIVE DATA HIDDEN]';
        expect(omitErrorMessageSensitiveData(input)).toBe(expected);
    });

    it('should return original string if no sensitive data is found', () => {
        const input = 'This is a normal error message without sensitive data';
        expect(omitErrorMessageSensitiveData(input)).toBe(input);
    });

    it('should handle empty string', () => {
        expect(omitErrorMessageSensitiveData('')).toBe('');
    });
});

describe('getGraphError', () => {
    it('should return the same Error instance unchanged', () => {
        const error = new Error('boom');
        expect(getGraphError(error)).toBe(error);
    });

    it('should return a subclassed Error instance unchanged', () => {
        class RippledError extends Error {}
        const error = new RippledError('invalidParams');
        expect(getGraphError(error)).toBe(error);
    });

    it('should rebuild an Error from a worker-boundary plain object, preserving name and stack', () => {
        // blockchain-link workers post errors across the worker boundary as plain objects,
        // so `instanceof Error` is false even though the shape looks like an Error.
        const workerError = {
            message: 'XRP: RippledError invalidParams',
            name: 'RippledError',
            stack: 'Error: RippledError invalidParams\n    at ?anon_0_',
        };

        const result = getGraphError(workerError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('XRP: RippledError invalidParams');
        expect(result.name).toBe('RippledError');
        expect(result.stack).toBe(workerError.stack);
    });

    it('should keep the default name and stack when the plain object omits them', () => {
        const result = getGraphError({ message: 'partial error' });

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('partial error');
        expect(result.name).toBe('Error');
        expect(typeof result.stack).toBe('string');
    });

    it('should fall back to String() for primitive values', () => {
        expect(getGraphError('plain string').message).toBe('plain string');
        expect(getGraphError(42).message).toBe('42');
        expect(getGraphError(null).message).toBe('null');
        expect(getGraphError(undefined).message).toBe('undefined');
    });
});
