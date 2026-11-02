import { type AccountKey } from '@suite-common/wallet-types';
import { useNow } from '@trezor/react-utils';

import { TronStakingUnstakeCard } from './TronStakingUnstakeCard/TronStakingUnstakeCard';
import { TronStakingWithdrawBanner } from './TronStakingWithdrawBanner';

const UNSTAKING_REFRESH_INTERVAL_MS = 60 * 1000;

type TronStakingPendingSectionProps = {
    accountKey: AccountKey;
};

export const TronStakingPendingSection = ({ accountKey }: TronStakingPendingSectionProps) => {
    const nowSeconds = useNow(UNSTAKING_REFRESH_INTERVAL_MS) / 1000;

    return (
        <>
            <TronStakingWithdrawBanner accountKey={accountKey} nowSeconds={nowSeconds} />
            <TronStakingUnstakeCard accountKey={accountKey} nowSeconds={nowSeconds} />
        </>
    );
};
