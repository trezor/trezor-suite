import { type SendOutputsFormValues } from './sendOutputsFormSchema';
import { constructFormDraft, getSendMaxAmount } from './utils';

describe(getSendMaxAmount.name, () => {
    test.each([
        {
            description: 'returns the token balance for a token send',
            input: {
                isTokenFlow: true,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            },
            expected: '42',
        },
        {
            description: 'returns the fee-adjusted amount for a native asset send',
            input: {
                isTokenFlow: false,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            },
            expected: '0.5',
        },
    ])('$description', ({ input, expected }) => {
        expect(getSendMaxAmount(input)).toBe(expected);
    });
});

describe(constructFormDraft.name, () => {
    const formValues = {
        outputs: [{ address: 'address', amount: '1', fiat: '' }],
    } as unknown as SendOutputsFormValues;

    it('tags the draft as a broadcast send', () => {
        expect(constructFormDraft({ formValues })).toMatchObject({
            txType: 'send',
            options: ['broadcast'],
        });
    });

    it('adds the destination tag and transaction data options when the form sets them', () => {
        const draft = constructFormDraft({
            formValues: { ...formValues, destinationTag: '123', transactionData: '0x00' },
        });

        expect(draft.options).toEqual(['broadcast', 'destinationTag', 'transactionData']);
        expect(draft.destinationTag).toBe('123');
        expect(draft.transactionData).toBe('0x00');
    });
});
