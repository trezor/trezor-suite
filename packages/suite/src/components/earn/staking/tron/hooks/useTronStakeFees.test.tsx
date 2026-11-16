import { useForm } from 'react-hook-form';

import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeesRootState, type TronStakeStepId } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type TronComposedTransaction } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { useTronStakeFees } from './useTronStakeFees';
import { type TronStakeFormValues } from './useTronStakeForm';

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

const preloadedState: FeesRootState = {
    wallet: {
        fees: {
            trx: {
                status: 'loaded',
                data: {
                    blockHeight: 123,
                    blockTime: 3,
                    minFee: 0,
                    maxFee: 0,
                    minPriorityFee: 0,
                    levels: [],
                },
            },
        },
    },
};

const renderFees = (step: TronStakeStepId = 'unstake', feeAccount = account) => {
    const { services } = createTestCompositionRoot<void, FeesRootState>({ preloadedState });
    const { dispatch } = createMockDispatch({ getState: services.store.getState });

    return renderHookWithStoreProvider(
        () => {
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
                account: feeAccount,
                step,
                form: { methods, markVoteAllocationsEdited: () => {} },
            });

            return { fees, methods };
        },
        { services: { ...services, store: { ...services.store, dispatch } } },
    );
};

describe('useTronStakeFees', () => {
    beforeEach(() => {
        jest.mocked(TrezorConnect.tronComposeTransaction).mockReset().mockResolvedValue(response);
    });

    it('retains the estimate when the account cannot pay the fee', async () => {
        const { result } = renderFees('claim', { ...account, availableBalance: '0' });

        await waitFor(() =>
            expect(result.current.fees.composedLevels?.normal).toMatchObject({
                type: 'error',
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                estimatedTransaction: { type: 'final', fee: '300000' },
            }),
        );
        expect(result.current.fees.hasError).toBe(false);
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
});
