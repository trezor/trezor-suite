import { type StakingNotifier } from '@suite-common/wallet-core';
import { type StakeType } from '@suite-common/wallet-types';
import {
    type NativeAnalyticsDep,
    type StakingConfirmAction,
    events,
} from '@suite-native/analytics';

const isStakingConfirmAction = (stakeType: StakeType): stakeType is StakingConfirmAction =>
    stakeType === 'stake' || stakeType === 'unstake' || stakeType === 'claim';

export const createNativeStakingNotifier = ({
    analytics,
}: NativeAnalyticsDep): StakingNotifier => ({
    onTransactionPushed: ({ account, stakeType }) => {
        if (!isStakingConfirmAction(stakeType)) return;

        analytics.report({
            type: events.stakingConfirmEvent.name,
            payload: { action: stakeType, networkSymbol: account.symbol },
        });
    },
    onTransactionPushFailed: () => {},
});
