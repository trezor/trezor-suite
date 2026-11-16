import { act, renderHook } from '@suite-common/test-utils';
import { type FeeInfo } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { useEvmTxSimulationFeesForm } from './useEvmTxSimulationFeesForm';

jest.mock('#src/hooks/suite/useSelector', () => ({ useSelector: () => undefined }));
jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ dispatch: jest.fn() }),
}));
jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getConvertedOrDefaultFeeInfo: jest.fn(),
}));

const presets = [
    { label: 'low', price: '1', priority: '0.1' },
    { label: 'normal', price: '10', priority: '0.2' },
    { label: 'high', price: '20', priority: '0.3' },
] as const;

type ExpectedFee = { price: string; priority: string; gasLimit?: string };

describe('useEvmTxSimulationFeesForm selection', () => {
    it.each(['legacy', 'eip1559'] as const)(
        'uses the selected %s prices and gas limit for preview, affordability and confirmation',
        type => {
            const feeInfo: FeeInfo = {
                blockHeight: 0,
                blockTime: 12,
                minFee: 0,
                maxFee: 100,
                minPriorityFee: 0,
                levels: presets.map(({ label, price, priority }) => ({
                    label,
                    blocks: 1,
                    feePerUnit: price,
                    ...(type === 'eip1559'
                        ? {
                              maxFeePerGas: price,
                              maxPriorityFeePerGas: priority,
                              baseFeePerGas: '0.5',
                          }
                        : {}),
                })),
            };
            jest.mocked(getConvertedOrDefaultFeeInfo).mockReturnValue(feeInfo);
            const { result } = renderHook(() =>
                useEvmTxSimulationFeesForm({
                    accountBalance: '420000000000000',
                    defaultGasLimit: '21000',
                }),
            );
            const expectFee = ({ price, priority, gasLimit = '21000' }: ExpectedFee): void => {
                const priceWei = BigInt(price) * 1_000_000_000n;
                const gasLimitHex = `0x${BigInt(gasLimit).toString(16)}`;
                expect(result.current.getSelectedFee()).toEqual(
                    type === 'eip1559'
                        ? {
                              type,
                              gasLimit: gasLimitHex,
                              maxFeePerGas: `0x${priceWei.toString(16)}`,
                              maxPriorityFeePerGas: `0x${BigInt(Number(priority) * 1e9).toString(16)}`,
                              baseFeePerGas: '0x1dcd6500',
                          }
                        : { type, gasLimit: gasLimitHex, gasPrice: `0x${priceWei.toString(16)}` },
                );
                const selected = result.current.form.getValues('selectedFee') ?? 'normal';
                expect(result.current.composedLevels[selected]).toMatchObject({
                    fee: (priceWei * BigInt(gasLimit)).toString(),
                });
            };

            expectFee(presets[1]);
            for (const preset of presets) {
                act(() => result.current.changeFeeLevel(preset.label));
                expectFee(preset);
            }
            act(() => result.current.changeFeeLevel('custom'));
            act(() => {
                result.current.form.setValue('feePerUnit', '50');
                result.current.form.setValue('maxFeePerGas', '50');
                result.current.form.setValue('maxPriorityFeePerGas', '2');
                result.current.form.setValue('feeLimit', '500000');
            });
            expectFee({ price: '50', priority: '2', gasLimit: '500000' });
            expect(result.current.composedLevelsError?.id).toBe('AMOUNT_NOT_ENOUGH_CURRENCY_FEE');

            for (const preset of presets) {
                act(() => result.current.changeFeeLevel(preset.label));
                expectFee(preset);
                expect(result.current.composedLevelsError).toBeUndefined();
            }

            act(() => result.current.changeFeeLevel('custom'));
            act(() => {
                result.current.form.setValue('feeLimit', '');
                result.current.form.setError('feeLimit', { type: 'manual' });
            });
            act(() => result.current.changeFeeLevel('low'));
            expectFee(presets[0]);
            expect(result.current.composedLevelsError).toBeUndefined();
        },
    );
});
