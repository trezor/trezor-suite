import { act, renderHook } from '@suite-common/test-utils';
import { type FeeInfo } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo, isInteger } from '@suite-common/wallet-utils';

import { useEvmTxSimulationFeesForm } from './useEvmTxSimulationFeesForm';

jest.mock('#src/hooks/suite/useSelector', () => ({ useSelector: () => undefined }));
jest.mock('#src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ changeFeeLevel: jest.fn() }),
}));
jest.mock('#src/hooks/wallet/form/useComposedLevelsPlaceholder', () => ({
    useComposedLevelsPlaceholder: () => ({}),
}));
jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getConvertedOrDefaultFeeInfo: jest.fn(),
}));

describe('useEvmTxSimulationFeesForm selection', () => {
    it.each(['legacy', 'eip1559'] as const)(
        'keeps the chosen fee level separate from %s gas values',
        type => {
            const feeInfo: FeeInfo = {
                blockHeight: 0,
                blockTime: 12,
                minFee: 0,
                maxFee: 100,
                minPriorityFee: 0,
                levels: (['low', 'normal', 'high'] as const).map(label => ({
                    label,
                    blocks: 1,
                    feePerUnit: '1',
                    ...(type === 'eip1559'
                        ? {
                              maxFeePerGas: '1',
                              maxPriorityFeePerGas: '0.1',
                              baseFeePerGas: '0.5',
                          }
                        : {}),
                })),
            };
            jest.mocked(getConvertedOrDefaultFeeInfo).mockReturnValue(feeInfo);
            const { result } = renderHook(() =>
                useEvmTxSimulationFeesForm({
                    accountBalance: '1000000000000000000',
                    defaultGasLimit: '21000',
                }),
            );

            for (const label of ['low', 'normal', 'high', 'custom'] as const) {
                act(() => result.current.form.setValue('selectedFee', label));

                expect(result.current.form.getValues('selectedFee')).toBe(label);
                expect(result.current.getSelectedFee()).toEqual(
                    type === 'eip1559'
                        ? {
                              type,
                              gasLimit: '0x5208',
                              maxFeePerGas: '0x3b9aca00',
                              maxPriorityFeePerGas: '0x5f5e100',
                              baseFeePerGas: '0x1dcd6500',
                          }
                        : { type, gasLimit: '0x5208', gasPrice: '0x3b9aca00' },
                );
            }
        },
    );
});

describe('useEvmTxSimulationFeesForm custom fee guard', () => {
    const renderWithGasLimitRule = () => {
        jest.mocked(getConvertedOrDefaultFeeInfo).mockReturnValue({
            blockHeight: 0,
            blockTime: 12,
            minFee: 0,
            maxFee: 100,
            minPriorityFee: 0,
            levels: [{ label: 'normal', blocks: 1, feePerUnit: '1' }],
        });
        const { result } = renderHook(() =>
            useEvmTxSimulationFeesForm({
                accountBalance: '1000000000000000000',
                defaultGasLimit: '21000',
            }),
        );
        // Stands in for the mounted gas limit input, which owns the real rules.
        act(() => {
            result.current.form.register('feeLimit', {
                validate: value => isInteger(value) || 'not an integer',
            });
        });

        return result;
    };

    it('blocks confirmation while a custom field is invalid', async () => {
        const result = renderWithGasLimitRule();

        act(() => {
            result.current.form.setValue('selectedFee', 'custom');
            result.current.form.setValue('feeLimit', '21000.5');
        });

        let isValid: boolean | undefined;
        await act(async () => {
            isValid = await result.current.validateCustomFee();
        });

        expect(isValid).toBe(false);
        expect(result.current.hasCustomFeeErrors).toBe(true);

        act(() => result.current.form.setValue('feeLimit', '21001'));
        await act(async () => {
            isValid = await result.current.validateCustomFee();
        });

        expect(isValid).toBe(true);
        expect(result.current.hasCustomFeeErrors).toBe(false);
    });

    it('ignores custom field errors once a preset level is selected', async () => {
        const result = renderWithGasLimitRule();

        act(() => {
            result.current.form.setValue('selectedFee', 'custom');
            result.current.form.setValue('feeLimit', '');
        });
        await act(async () => {
            await result.current.validateCustomFee();
        });
        act(() => result.current.form.setValue('selectedFee', 'normal'));

        let isValid: boolean | undefined;
        await act(async () => {
            isValid = await result.current.validateCustomFee();
        });

        expect(isValid).toBe(true);
        expect(result.current.hasCustomFeeErrors).toBe(false);
    });
});
