import { TRON_UNLOCKS_REFRESH_INTERVAL_MS } from '@suite-common/earn-staking';
import { type AccountKey } from '@suite-common/wallet-types';
import { useNow } from '@trezor/react-utils';

import { TronStakingUnstakeCard } from './TronStakingUnstakeCard/TronStakingUnstakeCard';
import { TronStakingWithdrawBanner } from './TronStakingWithdrawBanner';

type TronStakingPendingSectionProps = {
    accountKey: AccountKey;
};

// One clock for both, so an unlock never shows as withdrawable and as unstaking at once.
export const TronStakingPendingSection = ({ accountKey }: TronStakingPendingSectionProps) => {
    const nowMs = useNow(TRON_UNLOCKS_REFRESH_INTERVAL_MS);

    return (
        <>
            <TronStakingWithdrawBanner accountKey={accountKey} nowMs={nowMs} />
            <TronStakingUnstakeCard accountKey={accountKey} nowMs={nowMs} />
        </>
    );
};
