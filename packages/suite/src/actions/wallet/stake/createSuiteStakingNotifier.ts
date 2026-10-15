import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type StakingNotifier } from '@suite-common/wallet-core';

export const createSuiteStakingNotifier = ({
    analytics,
}: DesktopAnalyticsDep): StakingNotifier => ({
    onTransactionPushed: ({ account, stakeType }) => {
        // Ethereum and Solana report the confirmation from the transaction review modal; Cardano
        // broadcasts without one.
        if (account.networkType !== 'cardano') return;

        analytics.report({
            type: events.stakingConfirmEvent.name,
            payload: { action: stakeType, networkSymbol: account.symbol },
        });
    },
    onTransactionPushFailed: ({ account, stakeType }) => {
        analytics.report({
            type: events.stakingConfirmEvent.name,
            payload: { action: stakeType, networkSymbol: account.symbol, success: false },
        });
    },
});
