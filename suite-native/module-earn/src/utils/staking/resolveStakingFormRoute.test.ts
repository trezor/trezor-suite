import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { RootStackRoutes, type StakingPendingTxParams } from '@suite-native/navigation';

import { resolveStakingFormRoute } from './resolveStakingFormRoute';

const accountKey = mockAccountKey({ descriptor: 'testAccountKey' });
const networkSymbol = asNetworkSymbol('eth');
const pendingTransaction: StakingPendingTxParams = {
    amountInBaseUnits: '1000000000000000000',
    fee: '21000',
    submittedAt: 1_700_000_000_000,
    txid: '0xabc',
};

describe('resolveStakingFormRoute', () => {
    it('returns the staking form with the pending transaction for a stake', () => {
        expect(
            resolveStakingFormRoute({
                accountKey,
                networkSymbol,
                pendingTransaction,
                stakeType: 'stake',
            }),
        ).toEqual({
            name: RootStackRoutes.StakingForm,
            params: { accountKey, pendingTransaction },
        });
    });

    it('returns the unstake flow with the pending transaction for an unstake', () => {
        expect(
            resolveStakingFormRoute({
                accountKey,
                networkSymbol,
                pendingTransaction,
                stakeType: 'unstake',
            }),
        ).toEqual({
            name: RootStackRoutes.UnstakeFlow,
            params: { accountKey, pendingTransaction },
        });
    });

    it('returns the claim review with its network symbol for a claim', () => {
        expect(
            resolveStakingFormRoute({
                accountKey,
                networkSymbol,
                pendingTransaction,
                stakeType: 'claim',
            }),
        ).toEqual({
            name: RootStackRoutes.StakingClaimReview,
            params: { accountKey, symbol: networkSymbol, pendingTransaction },
        });
    });
});
