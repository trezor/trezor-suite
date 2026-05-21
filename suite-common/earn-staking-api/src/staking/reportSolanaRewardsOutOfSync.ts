import { captureException, withScope } from '@sentry/core';

import { type Account } from '@suite-common/wallet-types';

import { EARN_API_BASE_URL } from '../constants';

export function reportSolanaRewardsOutOfSync(account: Account) {
    withScope(scope => {
        scope.setTag('error.code', 'solana_rewards_history_out_of_sync');
        scope.setTag('error.source', EARN_API_BASE_URL);
        scope.setTag('error.network', account.networkType);
        scope.setTag('error.service', 'rewards_history');
        captureException(
            new Error(
                'Solana rewards history is out of sync with the current active epoch. Everstake API might return stale data.',
            ),
        );
    });
}
