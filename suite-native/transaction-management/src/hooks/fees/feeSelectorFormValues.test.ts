import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormState } from '@suite-common/wallet-types';

import { getFeeSelectorFormValues } from './feeSelectorFormValues';
import { createFeeLevel } from '../../__fixtures__/feeLevels';

const normal = createFeeLevel({ feeLimit: '21000', maxFeePerGas: '20', maxPriorityFeePerGas: '2' });
const savedCustom = {
    selectedFee: 'custom',
    feePerUnit: '15',
    feeLimit: '45000',
    maxFeePerGas: '35',
    maxPriorityFeePerGas: '4',
} as FormState;
const previousValues = {
    feeLevel: 'normal',
    customFeePerUnit: '10',
    customFeeLimit: '21000',
    customMaxFeePerGas: '20',
    customMaxPriorityFeePerGas: '2',
} as const;

describe('fee picker saved values', () => {
    it('uses the recommended TRC20 limit when the Send draft has an empty limit', () => {
        const values = getFeeSelectorFormValues({
            networkType: 'tron',
            selectedFee: 'normal',
            formDraft: { selectedFee: 'normal', feeLimit: '' } as FormState,
            feeLevels: { normal: createFeeLevel({ estimatedFeeLimit: '60000000' }) },
            previousValues,
        });
        expect(values.customFeeLimit).toBe('60000000');
    });

    it('keeps the prepared transaction gas available for Custom when every standard level is unaffordable', () => {
        const values = getFeeSelectorFormValues({
            networkType: 'ethereum',
            selectedFee: 'normal',
            formDraft: { selectedFee: 'normal', feeLimit: '200000' } as FormState,
            feeLevels: { normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' } },
            previousValues,
        });
        expect(values.customFeeLimit).toBe('200000');
    });

    it('preserves the confirmed TRC20 limit even though its draft selects normal', () => {
        const draft = { selectedFee: 'normal', feeLimit: '50000000' } as FormState;
        const values = getFeeSelectorFormValues({
            networkType: 'tron',
            selectedFee: 'normal',
            formDraft: draft,
            feeLevels: { normal },
            previousValues,
        });
        expect(values.customFeeLimit).toBe('50000000');
    });
    it('shows the gas values it will compose with when the standard fee has an error', () => {
        const values = getFeeSelectorFormValues({
            selectedFee: 'normal',
            formDraft: savedCustom,
            feeLevels: { normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' } },
            previousValues,
        });
        expect(values.customMaxFeePerGas).toBe('35');
        expect(values.customMaxPriorityFeePerGas).toBe('4');
    });

    it('seeds Low → Custom from the selected EIP-1559 level', () => {
        const low = createFeeLevel({
            feePerByte: '5',
            feeLimit: '30000',
            maxFeePerGas: '8',
            maxPriorityFeePerGas: '1',
        });
        expect(
            getFeeSelectorFormValues({
                symbol: asNetworkSymbol('eth'),
                networkType: 'ethereum',
                selectedFee: 'low',
                formDraft: undefined,
                feeLevels: { normal, low },
                previousValues,
            }),
        ).toEqual({
            feeLevel: 'low',
            customFeePerUnit: '8',
            customFeeLimit: '30000',
            customMaxFeePerGas: '8',
            customMaxPriorityFeePerGas: '1',
        });
    });
    it('normalizes Bitcoin rates when reopening Custom', () => {
        const values = getFeeSelectorFormValues({
            symbol: asNetworkSymbol('btc'),
            selectedFee: 'normal',
            formDraft: undefined,
            feeLevels: { normal: createFeeLevel({ feePerByte: '12.345678' }) },
            previousValues,
        });
        expect(values.customFeePerUnit).toBe('12.34');
    });

    it('reopens the confirmed custom EIP-1559 fields instead of normal defaults or abandoned edits', () => {
        expect(
            getFeeSelectorFormValues({
                networkType: 'ethereum',
                symbol: asNetworkSymbol('eth'),
                selectedFee: 'custom',
                formDraft: savedCustom,
                feeLevels: { normal },
                previousValues,
            }),
        ).toEqual({
            feeLevel: 'custom',
            customFeePerUnit: '15',
            customFeeLimit: '45000',
            customMaxFeePerGas: '35',
            customMaxPriorityFeePerGas: '4',
        });
    });

    it('uses the confirmed standard selection and clears previously edited custom values on reopening', () => {
        expect(
            getFeeSelectorFormValues({
                selectedFee: 'low',
                formDraft: savedCustom,
                feeLevels: { normal },
                previousValues,
            }).feeLevel,
        ).toBe('low');
        expect(
            getFeeSelectorFormValues({
                selectedFee: 'normal',
                formDraft: savedCustom,
                feeLevels: { normal },
                previousValues,
            }).customMaxFeePerGas,
        ).toBe('20');
    });
});
