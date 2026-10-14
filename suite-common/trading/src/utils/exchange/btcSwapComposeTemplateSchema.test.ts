import type { BtcSwapComposeTemplate } from 'invity-api';

import { parseBtcSwapComposeTemplate } from './btcSwapComposeTemplateSchema';

describe(parseBtcSwapComposeTemplate.name, () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns a valid template', () => {
        const template: BtcSwapComposeTemplate = {
            extraOutputs: [
                { type: 'opreturn', dataHex: 'deadBEEF' },
                { type: 'payment', amount: { kind: 'percent', value: 0.5 } },
                { type: 'payment', amount: { kind: 'sats', value: '546' } },
            ],
        };

        expect(parseBtcSwapComposeTemplate(template)).toEqual(template);
    });

    it('accepts a template without extra outputs', () => {
        expect(parseBtcSwapComposeTemplate({ extraOutputs: [] })).toEqual({ extraOutputs: [] });
    });

    it('strips unknown properties', () => {
        expect(
            parseBtcSwapComposeTemplate({
                extraOutputs: [{ type: 'opreturn', dataHex: '00', address: 'bc1q' }],
                unknown: true,
            }),
        ).toEqual({ extraOutputs: [{ type: 'opreturn', dataHex: '00' }] });
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
        ['missing extraOutputs', {}],
        ['non-array extraOutputs', { extraOutputs: {} }],
        ['unknown output type', { extraOutputs: [{ type: 'p2tr', dataHex: '00' }] }],
        ['non-hex dataHex', { extraOutputs: [{ type: 'opreturn', dataHex: 'custom_opreturn' }] }],
        ['odd-length dataHex', { extraOutputs: [{ type: 'opreturn', dataHex: 'abc' }] }],
        ['empty dataHex', { extraOutputs: [{ type: 'opreturn', dataHex: '' }] }],
        ['0x-prefixed dataHex', { extraOutputs: [{ type: 'opreturn', dataHex: '0xdead' }] }],
        ['missing payment amount', { extraOutputs: [{ type: 'payment' }] }],
        [
            'unknown amount kind',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'btc', value: '1' } }] },
        ],
        [
            'zero percent',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'percent', value: 0 } }] },
        ],
        [
            'percent over 100',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'percent', value: 101 } }] },
        ],
        [
            'non-finite percent',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'percent', value: Infinity } }] },
        ],
        [
            'percent as string',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'percent', value: '1' } }] },
        ],
        [
            'sats as number',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'sats', value: 546 } }] },
        ],
        [
            'zero sats',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'sats', value: '0' } }] },
        ],
        [
            'negative sats',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'sats', value: '-1' } }] },
        ],
        [
            'decimal sats',
            { extraOutputs: [{ type: 'payment', amount: { kind: 'sats', value: '1.5' } }] },
        ],
    ])('rejects %s', (_, rawTemplate) => {
        expect(parseBtcSwapComposeTemplate(rawTemplate)).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
            '[parseBtcSwapComposeTemplate]',
            expect.anything(),
        );
    });
});
