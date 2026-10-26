import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { StakeState } from '@trezor/network-solana/constants';

import { useUnstakeForm } from './useUnstakeForm';
import { useComposeEarnFees } from '../earn/useComposeEarnFees';

jest.mock('../earn/useComposeEarnFees', () => ({ useComposeEarnFees: jest.fn(() => ({})) }));
jest.mock('./useApproximateInstantUnstakeAmount', () => ({
    useApproximateInstantUnstakeAmount: () => null,
}));

const renderUnstake = (stakes: string[]) => {
    const account = mockWalletAccount(
        { symbol: asNetworkSymbol('sol') },
        {
            misc: {
                solStakingAccounts: stakes.map(stake => ({
                    status: StakeState.Active,
                    stake,
                    rentExemptReserve: '2282880',
                })),
            },
        },
    );

    return renderHookWithStoreProvider(() => useUnstakeForm(account.key), {
        preloadedState: { wallet: { accounts: [account] } },
    });
};

describe('useUnstakeForm Solana amounts', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each(['1', '1.1', '1.000000001', '3.5'])(
        'passes the exact valid amount %s SOL into staking composition',
        async amount => {
            const { result } = await renderUnstake(['3500000000']);
            await act(async () => {
                result.current?.form.setValue('amount', amount, { shouldValidate: true });
                await result.current?.form.trigger();
            });

            expect(result.current?.form.formState.isValid).toBe(true);
            expect(useComposeEarnFees).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    formDraftPrefix: 'unstake',
                    formState: expect.objectContaining({
                        outputs: [expect.objectContaining({ amount })],
                    }),
                }),
            );
        },
    );

    it('explains the invalid split between 1 and 2 SOL accounts before estimating fees', async () => {
        const { result } = await renderUnstake(['1000000000', '2000000000']);
        await act(async () => {
            result.current?.form.setValue('amount', '1.1', { shouldValidate: true });
            await result.current?.form.trigger();
        });

        expect(result.current?.form.formState.isValid).toBe(false);
        expect(result.current?.form.formState.errors.amount?.type).toBe(
            'solana-unstake-amount-bounds',
        );
        expect(useComposeEarnFees).toHaveBeenLastCalledWith(
            expect.objectContaining({ formState: undefined }),
        );
    });
});
