import { getOutput, hasDecimals } from '../sendFormUtils';

describe('sendForm utils', () => {
    it('get output', () => {
        const outputs = [
            {
                id: 1,
                address: { value: null, error: null },
                amount: { value: null, error: null },
                fiatValue: { value: null },
                localCurrency: { value: { value: 'value', label: 'label' } },
            },
            {
                id: 2,
                address: { value: null, error: null },
                amount: { value: null, error: null },
                fiatValue: { value: null },
                localCurrency: { value: { value: 'value', label: 'label' } },
            },
            {
                id: 3,
                address: { value: null, error: null },
                amount: { value: null, error: null },
                fiatValue: { value: null },
                localCurrency: { value: { value: 'value', label: 'label' } },
            },
        ];

        expect(getOutput(outputs, 1)).toBe(outputs[0]);
        expect(getOutput(outputs, 2)).toBe(outputs[1]);
        expect(getOutput(outputs, 3)).toBe(outputs[2]);
    });

    it('hasDecimals', () => {
        expect(hasDecimals('0', 'eth')).toBe(true);
        expect(hasDecimals('0.0', 'eth')).toBe(true);
        expect(hasDecimals('0.00000000', 'eth')).toBe(true);
        expect(hasDecimals('0.00000001', 'eth')).toBe(true);
        expect(hasDecimals('+0.0', 'eth')).toBe(false);
        expect(hasDecimals('-0.0', 'eth')).toBe(false);
        expect(hasDecimals('1', 'eth')).toBe(true);
        expect(hasDecimals('+1', 'eth')).toBe(false);
        expect(hasDecimals('+100000', 'eth')).toBe(false);
        expect(hasDecimals('.', 'eth')).toBe(false);
        expect(hasDecimals('-.1', 'eth')).toBe(false);
        expect(hasDecimals('0.1', 'eth')).toBe(true);
        expect(hasDecimals('0.12314841', 'eth')).toBe(true);
        expect(hasDecimals('0.1381841848184814818391931933', 'eth')).toBe(false);
        expect(hasDecimals('0.100000000000000000', 'eth')).toBe(true);

        expect(hasDecimals('100.', 'eth')).toBe(true);
        expect(hasDecimals('.1', 'eth')).toBe(false);
        expect(hasDecimals('.000000001', 'eth')).toBe(false);
        expect(hasDecimals('.13134818481481841', 'eth')).toBe(false);

        expect(hasDecimals('001.12314841', 'eth')).toBe(false);
        expect(hasDecimals('83819319391491949941', 'eth')).toBe(true);
        expect(hasDecimals('-83819319391491949941', 'eth')).toBe(false);
        expect(hasDecimals('+0.131831848184', 'eth')).toBe(false);
        expect(hasDecimals('0.127373193981774718318371831731761626162613', 'eth')).toBe(false);

        expect(hasDecimals('0.131831848184a', 'eth')).toBe(false);
        expect(hasDecimals('100a', 'eth')).toBe(false);
        expect(hasDecimals('.100a', 'eth')).toBe(false);
        expect(hasDecimals('a.100', 'eth')).toBe(false);
        expect(hasDecimals('abc', 'eth')).toBe(false);
        expect(hasDecimals('1abc0', 'eth')).toBe(false);
    });
});
