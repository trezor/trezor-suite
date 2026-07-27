import { createBuilder } from '../../builder/createBuilder';
import { type Encoder } from '../../types/builder';
import { type IssueWithSeverity } from '../../types/policy';

describe('createBuilder', () => {
    it('calls params and encode, returns encoded data when all valid', () => {
        const toParam = jest.fn().mockReturnValue({
            value: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            issues: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            errors: [],
            warnings: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            isValid: true,
        });
        const amountParam = jest.fn().mockReturnValue({
            value: 1000n,
            issues: [],
            errors: [],
            warnings: [],
            isValid: true,
        });
        const encode: Encoder<'to' | 'amount', string> = jest.fn().mockReturnValue('0xencoded');
        const crossValidate = jest.fn().mockReturnValue([]);
        const context = { sender: '0xsender', balance: 5000n };

        const builder = createBuilder({
            encode,
            params: { to: toParam, amount: amountParam },
            crossValidate: [crossValidate],
        });

        const result = builder(
            { to: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', amount: '1000' },
            context,
        );

        expect(toParam).toHaveBeenCalledWith(
            '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            'to',
            context,
        );
        expect(amountParam).toHaveBeenCalledWith('1000', 'amount', context);
        expect(encode).toHaveBeenCalledWith({
            to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            amount: 1000n,
        });
        expect(result).toEqual({
            data: '0xencoded',
            issues: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            errors: [],
            warnings: [{ code: 'ZERO_ADDRESS', path: 'to', severity: 'warning' }],
            isValid: true,
        });
    });

    it('returns null data and collects all errors when params invalid', () => {
        const toParam = jest.fn().mockReturnValue({
            value: null,
            issues: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }],
            errors: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }],
            warnings: [],
            isValid: false,
        });
        const amountParam = jest.fn().mockReturnValue({
            value: null,
            issues: [{ code: 'NEGATIVE_AMOUNT', path: 'amount', severity: 'error' }],
            errors: [{ code: 'NEGATIVE_AMOUNT', path: 'amount', severity: 'error' }],
            warnings: [],
            isValid: false,
        });
        const encode: Encoder<'to' | 'amount', string> = jest.fn();

        const builder = createBuilder({
            encode,
            params: { to: toParam, amount: amountParam },
        });

        const result = builder({ to: 'invalid', amount: '-100' });

        expect(encode).not.toHaveBeenCalled();
        expect(result).toEqual({
            data: null,
            issues: [
                { code: 'INVALID_ADDRESS', path: 'to', severity: 'error' },
                { code: 'NEGATIVE_AMOUNT', path: 'amount', severity: 'error' },
            ],
            errors: [
                { code: 'INVALID_ADDRESS', path: 'to', severity: 'error' },
                { code: 'NEGATIVE_AMOUNT', path: 'amount', severity: 'error' },
            ],
            warnings: [],
            isValid: false,
        });
    });

    it('skips crossValidate when params are invalid', () => {
        const toParam = jest.fn().mockReturnValue({
            value: null,
            issues: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }],
            errors: [{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }],
            warnings: [],
            isValid: false,
        });
        const encode: Encoder<'to', string> = jest.fn();
        const crossValidate = jest.fn();

        const builder = createBuilder({
            encode,
            params: { to: toParam },
            crossValidate: [crossValidate],
        });

        builder({ to: 'invalid' });

        expect(crossValidate).not.toHaveBeenCalled();
    });

    it('runs crossValidate after params pass and blocks encoding on cross param error', () => {
        const toParam = jest.fn().mockReturnValue({
            value: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            issues: [],
            errors: [],
            warnings: [],
            isValid: true,
        });
        const encode: Encoder<'to', string> = jest.fn();
        const crossIssue: IssueWithSeverity = {
            code: 'ARRAYS_LENGTH_MISMATCH',
            path: null,
            severity: 'error',
        };
        const crossValidate = jest.fn().mockReturnValue([crossIssue]);

        const builder = createBuilder({
            encode,
            params: { to: toParam },
            crossValidate: [crossValidate],
        });

        const result = builder({ to: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' });

        expect(encode).not.toHaveBeenCalled();
        expect(result).toEqual({
            data: null,
            issues: [crossIssue],
            errors: [crossIssue],
            warnings: [],
            isValid: false,
        });
    });

    it('returns ENCODING_FAILED when encoder throws', () => {
        const toParam = jest.fn().mockReturnValue({
            value: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            issues: [],
            errors: [],
            warnings: [],
            isValid: true,
        });
        const amountParam = jest.fn().mockReturnValue({
            value: 1000n,
            issues: [],
            errors: [],
            warnings: [],
            isValid: true,
        });
        const encode: Encoder<'to' | 'amount', string> = jest.fn().mockImplementation(() => {
            throw new Error('Encoding failed');
        });

        const builder = createBuilder({
            encode,
            params: { to: toParam, amount: amountParam },
        });

        const result = builder({
            to: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            amount: '1000',
        });

        expect(result).toEqual({
            data: null,
            issues: [{ code: 'ENCODING_FAILED', path: null, severity: 'error' }],
            errors: [{ code: 'ENCODING_FAILED', path: null, severity: 'error' }],
            warnings: [],
            isValid: false,
        });
    });
});
