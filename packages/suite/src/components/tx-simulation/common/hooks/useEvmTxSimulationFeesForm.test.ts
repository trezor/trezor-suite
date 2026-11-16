import { combineReducers } from '@reduxjs/toolkit';

import { type TranslationFunction } from '@suite/intl';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { type TxSimulationEVMResult } from '@suite-common/tx-simulation';
import { type FeeInfo } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { getCustomFeeEthereumRules } from '#src/components/wallet/Fees/CollapsibleFees/CustomFee/getCustomFeeEthereumRules';

import { useEvmTxSimulationFeesForm } from './useEvmTxSimulationFeesForm';

jest.mock('#src/hooks/suite/useSelector', () => ({ useSelector: () => undefined }));
jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    useTranslation: () => ({ translationString: (id: string) => id }),
}));
jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getConvertedOrDefaultFeeInfo: jest.fn(),
}));

type State = { wallet: { fees: Record<string, never> } };

const translationString: TranslationFunction = id => id;

const renderFeesForm = (feeInfo: FeeInfo, defaultGasLimit = '21000') => {
    jest.mocked(getConvertedOrDefaultFeeInfo).mockReturnValue(feeInfo);
    const { services } = createTestCompositionRoot<void, State>({
        reducer: combineReducers({ wallet: () => ({ fees: {} }) }),
    });

    const { result } = renderHookWithStoreProvider(
        () =>
            useEvmTxSimulationFeesForm({ accountBalance: '1000000000000000000', defaultGasLimit }),
        { services },
    );

    return result;
};

describe('useEvmTxSimulationFeesForm selection', () => {
    it('uses the selected legacy gas price after leaving Custom', () => {
        const result = renderFeesForm({
            blockHeight: 0,
            blockTime: 12,
            minFee: 1,
            maxFee: 100,
            minPriorityFee: 0,
            levels: [
                { label: 'low', blocks: 1, feePerUnit: '2' },
                { label: 'normal', blocks: 1, feePerUnit: '10' },
                { label: 'high', blocks: 1, feePerUnit: '20' },
            ],
        });

        act(() => result.current.changeFeeLevel('custom'));
        act(() => {
            result.current.form.setValue('feePerUnit', '50');
            result.current.form.setValue('feeLimit', '50000');
        });
        act(() => result.current.changeFeeLevel('low'));

        expect(result.current.getSelectedFee()).toEqual({
            type: 'legacy',
            gasLimit: '0x5208',
            gasPrice: '0x77359400',
        });
        expect(result.current.composedLevels.low).toMatchObject({
            fee: String(2e9 * 21000),
        });
    });
});

describe('useEvmTxSimulationFeesForm custom fee', () => {
    const FEE_INFO: FeeInfo = {
        blockHeight: 0,
        blockTime: 12,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 0,
        levels: [
            { label: 'low' as const, maxFeePerGas: '10', maxPriorityFeePerGas: '1' },
            { label: 'normal' as const, maxFeePerGas: '20', maxPriorityFeePerGas: '2' },
            { label: 'high' as const, maxFeePerGas: '30', maxPriorityFeePerGas: '3' },
        ].map(level => ({ ...level, blocks: 1, feePerUnit: '20', baseFeePerGas: '5' })),
    };

    const HIGH_LEVEL_FEE = {
        type: 'eip1559',
        gasLimit: '0x5208',
        maxFeePerGas: '0x6fc23ac00',
        maxPriorityFeePerGas: '0xb2d05e00',
        baseFeePerGas: '0x12a05f200',
    };

    // Registers the rules the mounted CustomFeeEthereum inputs would, then opens Custom.
    const renderCustomFee = (defaultGasLimit?: string) => {
        const result = renderFeesForm(FEE_INFO, defaultGasLimit);
        const { form, changeFeeLevel } = result.current;
        const rules = getCustomFeeEthereumRules({
            translationString,
            sharedRules: { required: translationString('CUSTOM_FEE_IS_NOT_SET') },
            feeInfo: FEE_INFO,
            networkType: 'ethereum',
            getValues: form.getValues,
        });

        act(() => {
            form.register('feeLimit', rules.gasLimitRules);
            form.register('maxFeePerGas', rules.maxFeePerGasRules);
            form.register('maxPriorityFeePerGas', rules.maxPriorityFeePerGasRules);
        });
        act(() => changeFeeLevel('custom'));

        return result;
    };

    const validateCustomFee = async (result: ReturnType<typeof renderCustomFee>) => {
        let isValid: boolean | undefined;
        await act(async () => {
            isValid = await result.current.validateCustomFee();
        });

        return isValid;
    };

    it('accepts the values Custom opens with', async () => {
        const result = renderCustomFee();

        expect(await validateCustomFee(result)).toBe(true);
        expect(result.current.hasCustomFeeErrors).toBe(false);
    });

    it.each([
        { case: 'a fractional gas limit', field: 'feeLimit', value: '21000.5' },
        { case: 'a zero gas limit', field: 'feeLimit', value: '0' },
        { case: 'an empty priority fee', field: 'maxPriorityFeePerGas', value: '' },
        { case: 'a priority fee above the max fee', field: 'maxPriorityFeePerGas', value: '25' },
    ] as const)('blocks confirmation with $case', async ({ field, value }) => {
        const result = renderCustomFee();

        act(() => result.current.form.setValue(field, value));

        expect(await validateCustomFee(result)).toBe(false);
        expect(result.current.hasCustomFeeErrors).toBe(true);
    });

    it('accepts a hex default gas limit', async () => {
        const result = renderCustomFee('0x5208');

        expect(result.current.form.getValues('feeLimit')).toBe('21000');
        expect(await validateCustomFee(result)).toBe(true);
        expect(result.current.getSelectedFee()).toMatchObject({ gasLimit: '0x5208' });
    });

    it('signs a preset level after leaving Custom with an invalid gas limit', async () => {
        const result = renderCustomFee();

        act(() => result.current.form.setValue('feeLimit', '21000.5'));
        expect(await validateCustomFee(result)).toBe(false);

        act(() => result.current.changeFeeLevel('high'));

        expect(await validateCustomFee(result)).toBe(true);
        expect(result.current.hasCustomFeeErrors).toBe(false);
        expect(result.current.getSelectedFee()).toEqual(HIGH_LEVEL_FEE);
    });

    it('blocks confirmation with an invalid gas limit while the fee panel is collapsed', async () => {
        // No rules registered: the collapsed panel unmounted the inputs, so `trigger` skips them.
        const result = renderFeesForm(FEE_INFO);

        act(() => result.current.changeFeeLevel('custom'));
        act(() => result.current.form.setValue('feeLimit', '0'));

        expect(await validateCustomFee(result)).toBe(false);
        expect(result.current.hasCustomFeeErrors).toBe(true);
    });

    it('clears a gas limit error once a simulation estimate replaces the gas limit', async () => {
        const result = renderCustomFee();

        act(() => result.current.form.setValue('estimatedFeeLimit', '250000'));
        expect(await validateCustomFee(result)).toBe(false);

        await act(async () => {
            result.current.handleTxSimulationResult({
                simulation: { status: 'Success' },
                gas_estimation: { status: 'Success', estimate: '0xb5369' },
                isChainSupported: true,
            } as TxSimulationEVMResult);
            // Lets the validation `setValue` started settle.
            await Promise.resolve();
        });

        expect(result.current.form.getValues('feeLimit')).toBe('742249');
        expect(result.current.hasCustomFeeErrors).toBe(false);
    });

    it('signs the preset level values, not the leftover custom ones', () => {
        const result = renderCustomFee();

        act(() => {
            result.current.form.setValue('feeLimit', '50000');
            result.current.form.setValue('maxFeePerGas', '5');
            result.current.form.setValue('maxPriorityFeePerGas', '2');
        });
        act(() => result.current.changeFeeLevel('high'));

        expect(result.current.getSelectedFee()).toEqual(HIGH_LEVEL_FEE);
        expect(result.current.composedLevels.high).toMatchObject({
            fee: String(30e9 * 21000),
        });
    });
});
