import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { RootStackRoutes, type StakingPendingTxParams } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { type EarnFormDraftPrefix } from '../../types';

type ResolveStakingFormRouteParams = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
    pendingTransaction: StakingPendingTxParams;
    stakeType: EarnFormDraftPrefix;
};

export const resolveStakingFormRoute = ({
    accountKey,
    networkSymbol,
    pendingTransaction,
    stakeType,
}: ResolveStakingFormRouteParams) => {
    switch (stakeType) {
        case 'stake':
            return {
                name: RootStackRoutes.StakingForm,
                params: { accountKey, pendingTransaction },
            };
        case 'unstake':
            return {
                name: RootStackRoutes.UnstakeFlow,
                params: { accountKey, pendingTransaction },
            };
        case 'claim':
            return {
                name: RootStackRoutes.StakingClaimReview,
                params: { accountKey, symbol: networkSymbol, pendingTransaction },
            };
        default:
            return exhaustive(stakeType);
    }
};
