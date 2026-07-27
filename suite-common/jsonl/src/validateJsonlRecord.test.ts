import * as yup from 'yup';

import { validateJsonlRecord } from './validateJsonlRecord';

const testSchema = yup.object({
    label: yup.string().required(),
    count: yup.number().optional(),
});

describe(validateJsonlRecord.name, () => {
    it('validates a matching record', () => {
        expect(validateJsonlRecord({ label: 'Test' }, testSchema, 1)).toEqual({
            success: true,
            payload: { label: 'Test' },
        });
    });

    it('validates a record with optional fields', () => {
        expect(validateJsonlRecord({ label: 'Test', count: 5 }, testSchema, 1)).toEqual({
            success: true,
            payload: { label: 'Test', count: 5 },
        });
    });

    it('returns an error for a missing required field', () => {
        expect(validateJsonlRecord({ count: 5 }, testSchema, 2)).toEqual({
            success: false,
            error: {
                type: 'JsonlRecordDoesNotMatchSchema',
                lineNumber: 2,
                message: expect.stringContaining('label'),
            },
        });
    });

    it('returns an error for a wrong field type', () => {
        expect(validateJsonlRecord({ label: 123 }, testSchema, 7)).toEqual({
            success: false,
            error: {
                type: 'JsonlRecordDoesNotMatchSchema',
                lineNumber: 7,
                message: expect.stringContaining('Path: "label"'),
            },
        });
    });

    it('includes the correct line number in the error', () => {
        const result = validateJsonlRecord({}, testSchema, 99);

        expect(result.success).toBe(false);

        if (!result.success) {
            expect(result.error.lineNumber).toBe(99);
        }
    });
});
