import * as yup from 'yup';

import { parseJsonl } from '../parseJsonl';

const testSchema = yup.object({
    label: yup.string().required(),
});

describe('parseJsonl', () => {
    it('parses JSONL records', () => {
        expect(parseJsonl('{"label":"First"}\n{"label":"Second"}', testSchema)).toEqual({
            success: true,
            payload: [{ label: 'First' }, { label: 'Second' }],
        });
    });

    it('skips blank lines', () => {
        expect(parseJsonl('{"label":"First"}\n\n{"label":"Second"}\n', testSchema)).toEqual({
            success: true,
            payload: [{ label: 'First' }, { label: 'Second' }],
        });
    });

    it('supports CRLF line endings', () => {
        expect(parseJsonl('{"label":"First"}\r\n{"label":"Second"}', testSchema)).toEqual({
            success: true,
            payload: [{ label: 'First' }, { label: 'Second' }],
        });
    });

    it('returns an error when a line is not valid JSON', () => {
        expect(parseJsonl('{"label":"First"}\nnot-json', testSchema)).toEqual({
            success: false,
            error: {
                type: 'JsonlInvalidJson',
                lineNumber: 2,
                message: expect.any(String),
            },
        });
    });

    it('returns an error when a line is not a JSON object', () => {
        expect(parseJsonl('{"label":"First"}\n[1,2,3]', testSchema)).toEqual({
            success: false,
            error: {
                type: 'JsonlRecordIsNotObject',
                lineNumber: 2,
            },
        });
    });

    it('returns an error when a line does not match the schema', () => {
        expect(parseJsonl('{"label":"First"}\n{"label":1}', testSchema)).toEqual({
            success: false,
            error: {
                type: 'JsonlRecordDoesNotMatchSchema',
                lineNumber: 2,
                message: expect.stringContaining('Path: "label"'),
            },
        });
    });
});
