import { act, renderHook } from '@suite-common/test-utils';
import { type FeeInfo } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { useEvmTxSimulationFeesForm } from './useEvmTxSimulationFeesForm';

jest.mock('src/hooks/suite', () => ({ useSelector: () => undefined }));
jest.mock('src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ changeFeeLevel: jest.fn() }),
}));
jest.mock('src/hooks/wallet/form/useComposedLevelsPlaceholder', () => ({
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
