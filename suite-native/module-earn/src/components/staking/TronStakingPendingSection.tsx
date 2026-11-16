import { type AccountKey } from '@suite-common/wallet-types';

import { TronStakingUnstakeCard } from './TronStakingUnstakeCard/TronStakingUnstakeCard';
import { TronStakingWithdrawBanner } from './TronStakingWithdrawBanner';

type TronStakingPendingSectionProps = {
    accountKey: AccountKey;
};

export const TronStakingPendingSection = ({ accountKey }: TronStakingPendingSectionProps) => (
    <>
        <TronStakingWithdrawBanner accountKey={accountKey} />
        <TronStakingUnstakeCard accountKey={accountKey} />
    </>
);
