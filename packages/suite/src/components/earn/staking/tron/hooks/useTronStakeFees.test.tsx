import { useForm } from 'react-hook-form';

import { act, renderHook, waitFor } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TronStakeStepId } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type TronComposedTransaction } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { useTronStakeFees } from './useTronStakeFees';
import { type TronStakeFormValues } from './useTronStakeForm';

const { dispatch } = createMockDispatch({ getState: () => undefined, extra: {} });
jest.mock('#src/hooks/suite/useSelector', () => ({ useSelector: () => undefined }));
jest.mock('@trezor/dependency-injection', () => ({
    ...jest.requireActual('@trezor/dependency-injection'),
    useServices: () => ({ dispatch }),
}));
jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: { ...actual.default, tronComposeTransaction: jest.fn() },
    };
});

const response: { success: true; payload: TronComposedTransaction } = {
    success: true,
    payload: {
        rawDataHex: '0a00',
        ref_block_bytes: '0001',
        ref_block_hash: '0000000000000000',
        expiration: 1_700_000_060_000,
        timestamp: 1_700_000_000_000,
        bandwidth: 300,
    },
};
const account = mockWalletAccount(
    {
        symbol: asNetworkSymbol('trx'),
        descriptor: asAccountDescriptor('TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr'),
        availableBalance: '1000000',
    },
    {
        networkType: 'tron',
        misc: { tronResources: { availableFreeBandwidth: 0, availableStakedBandwidth: 0 } },
    },
);

const renderFees = (step: TronStakeStepId = 'unstake') =>
    renderHook(() => {
        const methods = useForm<TronStakeFormValues>({
            defaultValues: {
                amount: '1',
                fiatAmount: '',
                resourceType: 'energy',
                selectedFee: 'normal',
                voteAllocations: [],
            },
        });
        const fees = useTronStakeFees({
            account,
            step,
            form: { methods, markVoteAllocationsEdited: () => {} },
        });

        return { fees, methods };
    });

describe('useTronStakeFees', () => {
    beforeEach(() => {
        jest.mocked(TrezorConnect.tronComposeTransaction).mockReset().mockResolvedValue(response);
    });

    it('hides a previous fee immediately and ignores a late response for an older amount', async () => {
        const { result } = renderFees();
        await waitFor(() => expect(result.current.fees.composedLevels?.normal?.type).toBe('final'));
        const older = createDeferred<typeof response>();
        const latest = createDeferred<typeof response>();
        jest.mocked(TrezorConnect.tronComposeTransaction)
            .mockReturnValueOnce(older.promise)
            .mockReturnValueOnce(latest.promise);

        act(() => result.current.methods.setValue('amount', '2'));
        expect(result.current.fees.composedLevels).toBeUndefined();
        act(() => result.current.methods.setValue('amount', '3'));
        await act(async () => {
            latest.resolve(response);
            await latest.promise;
        });
        await waitFor(() =>
            expect(result.current.fees.composedLevels?.normal).toMatchObject({
                type: 'final',
                outputs: [{ amount: '3000000' }],
            }),
        );

        await act(async () => {
            older.resolve(response);
            await older.promise;
        });
        expect(result.current.fees.composedLevels?.normal).toMatchObject({
            type: 'final',
            outputs: [{ amount: '3000000' }],
        });
    });

    it('reports a failed estimate and retries without changing the amount', async () => {
        jest.mocked(TrezorConnect.tronComposeTransaction).mockRejectedValueOnce(
            new Error('Fee encoding failed'),
        );
        const { result } = renderFees('claim');
        await waitFor(() => expect(result.current.fees.hasError).toBe(true));
        expect(result.current.fees.composedLevels).toBeUndefined();

        act(() => result.current.fees.retry());
        expect(result.current.fees.hasError).toBe(false);
        await waitFor(() => expect(result.current.fees.composedLevels?.normal?.type).toBe('final'));
        expect(TrezorConnect.tronComposeTransaction).toHaveBeenCalledTimes(2);
    });

    it.each(['claim', 'withdraw'] as const)(
        'keeps the %s estimate when unrelated amount fields change',
        async step => {
            const { result } = renderFees(step);
            await waitFor(() =>
                expect(result.current.fees.composedLevels?.normal?.type).toBe('final'),
            );
            act(() => result.current.methods.setValue('amount', '2'));
            expect(result.current.fees.composedLevels?.normal?.type).toBe('final');
            expect(TrezorConnect.tronComposeTransaction).toHaveBeenCalledTimes(1);
        },
    );

    it('does not report an estimation failure for an empty amount', async () => {
        const { result } = renderFees();
        await waitFor(() => expect(result.current.fees.composedLevels?.normal?.type).toBe('final'));
        act(() => result.current.methods.setValue('amount', ''));
        expect(result.current.fees.composedLevels).toBeUndefined();
        expect(result.current.fees.hasError).toBe(false);
        expect(TrezorConnect.tronComposeTransaction).toHaveBeenCalledTimes(1);
    });
});
