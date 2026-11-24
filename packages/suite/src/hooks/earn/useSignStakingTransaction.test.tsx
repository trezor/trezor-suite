import { type PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';

import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getStakeFormsDefaultValues } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal, type StakeFormState } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import { useSignStakingTransaction } from './useSignStakingTransaction';

const mockVerify = jest.fn();
const mockSign = jest.fn();
jest.mock('./useStakingDeviceAction', () => ({
    useStakingDeviceAction: () => async (sign: (device: TrezorDevice) => Promise<void>) => {
        const device = await mockVerify();
        if (device) await sign(device);
    },
}));
jest.mock('#src/actions/wallet/stakeActions', () => ({
    signTransactionThunk: (params: unknown) => mockSign(params),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const formValues: StakeFormState = {
    ...getStakeFormsDefaultValues({ address: account.descriptor, stakeType: 'stake' }),
    options: ['broadcast'],
    setMaxOutputId: undefined,
};
const transactionInfo: PrecomposedTransactionFinal = {
    type: 'final',
    fee: '10',
    feePerByte: '1',
    bytes: 10,
    totalSpent: '20',
    max: undefined,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};

describe(useSignStakingTransaction.name, () => {
    beforeEach(() => jest.clearAllMocks());

    it('reconnects to refresh a missing fee and leaves the new composition for review', async () => {
        const device = mockSuiteDevice({ connected: true, available: true });
        mockVerify.mockResolvedValue(device);
        const dispatch = jest.fn();
        const refreshComposition = jest.fn();
        const onSuccess = jest.fn();
        const { result } = renderHook(() => useSignStakingTransaction(account), {
            wrapper: ({ children }: PropsWithChildren) => (
                <ServicesProvider services={{ store: { dispatch } }}>{children}</ServicesProvider>
            ),
        });
        await act(() => result.current({ formValues, refreshComposition, onSuccess }));
        expect(mockVerify).toHaveBeenCalledTimes(1);
        expect(refreshComposition).toHaveBeenCalledTimes(1);
        expect(dispatch).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it.each([false, true])(
        'preserves the form and review until the wallet is verified (accepted=%s)',
        async accepted => {
            const verified = createDeferred<TrezorDevice | undefined>();
            const device = mockSuiteDevice({
                path: 'reconnected',
                connected: true,
                available: true,
            });
            mockVerify.mockReturnValue(verified.promise);
            const dispatch = jest.fn().mockResolvedValue({ success: true });
            const beforeSigning = jest.fn();
            const onSuccess = jest.fn();
            const { result } = renderHook(() => useSignStakingTransaction(account), {
                wrapper: ({ children }: PropsWithChildren) => (
                    <ServicesProvider services={{ store: { dispatch } }}>
                        {children}
                    </ServicesProvider>
                ),
            });

            await act(async () => {
                const submit = result.current({
                    formValues,
                    transactionInfo,
                    beforeSigning,
                    onSuccess,
                });
                expect(beforeSigning).not.toHaveBeenCalled();
                expect(mockSign).not.toHaveBeenCalled();
                verified.resolve(accepted ? device : undefined);
                await submit;
            });

            expect(mockVerify).toHaveBeenCalledTimes(1);
            if (accepted) {
                expect(beforeSigning).toHaveBeenCalledTimes(1);
                expect(mockSign).toHaveBeenCalledWith({
                    device,
                    accountKey: account.key,
                    formValues,
                    transactionInfo,
                });
                expect(onSuccess).toHaveBeenCalledTimes(1);
            } else {
                expect(beforeSigning).not.toHaveBeenCalled();
                expect(dispatch).not.toHaveBeenCalled();
                expect(onSuccess).not.toHaveBeenCalled();
            }
        },
    );
});
