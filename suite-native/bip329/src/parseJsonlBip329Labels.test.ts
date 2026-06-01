import { parseJsonlBip329Labels } from './parseJsonlBip329Labels';

const parseAndExpectLabels = (content: string) => {
    const result = parseJsonlBip329Labels(content);
    expect(result).toMatchObject({ success: true });

    if (!result.success) {
        throw new Error('Expected success but got failure');
    }

    return result.payload;
};

describe(parseJsonlBip329Labels.name, () => {
    it.each([
        [
            'tx label',
            '{"type":"tx","ref":"txid123","label":"Payment"}',
            [{ type: 'tx', ref: 'txid123', label: 'Payment' }],
        ],
        [
            'addr label',
            '{"type":"addr","ref":"bc1qtest","label":"My address"}',
            [{ type: 'addr', ref: 'bc1qtest', label: 'My address' }],
        ],
        [
            'output label with spendable',
            '{"type":"output","ref":"txid:0","label":"Change","spendable":true}',
            [{ type: 'output', ref: 'txid:0', label: 'Change', spendable: true }],
        ],
        [
            'multiple labels',
            '{"type":"tx","ref":"txid1","label":"A"}\n{"type":"tx","ref":"txid2","label":"B"}',
            [
                { type: 'tx', ref: 'txid1', label: 'A' },
                { type: 'tx', ref: 'txid2', label: 'B' },
            ],
        ],
    ])('parses %s', (_desc, content, expected) => {
        const labels = parseAndExpectLabels(content);

        expect(labels).toMatchObject(expected);
    });

    it.each([
        ['empty string', '', 0],
        ['whitespace-only lines', '   \n  \n\n', 0],
        ['trailing newline', '{"type":"tx","ref":"txid1","label":"A"}\n', 1],
        [
            '\\r\\n line endings',
            '{"type":"tx","ref":"txid1","label":"A"}\r\n{"type":"tx","ref":"txid2","label":"B"}',
            2,
        ],
    ])('handles %s', (_desc, content, expectedCount) => {
        const labels = parseAndExpectLabels(content);

        expect(labels).toHaveLength(expectedCount);
    });

    it('does not include spendable when not provided', () => {
        const labels = parseAndExpectLabels('{"type":"tx","ref":"txid1","label":"Test"}');

        expect(labels[0]).not.toHaveProperty('spendable');
    });

    it('passes through unknown fields', () => {
        const labels = parseAndExpectLabels(
            '{"type":"tx","ref":"txid1","label":"A","extraField":"kept"}',
        );

        expect((labels[0] as Record<string, unknown>).extraField).toBe('kept');
    });

    it.each([
        ['invalid JSON', 'not json'],
        ['JSON array', '[1, 2, 3]'],
        ['JSON primitive', '"just a string"'],
        ['object not matching schema', '{"foo":"bar"}'],
        [
            'valid line followed by invalid',
            '{"type":"tx","ref":"txid1","label":"OK"}\n{"invalid":"data"}',
        ],
    ])('rejects %s', (_desc, content) => {
        expect(parseJsonlBip329Labels(content)).toMatchObject({ success: false });
    });
});
