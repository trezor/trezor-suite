import { getOutput } from '../sendFormUtils';

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
});
