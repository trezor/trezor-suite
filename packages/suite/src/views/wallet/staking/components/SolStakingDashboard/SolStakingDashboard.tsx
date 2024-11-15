import { SelectedAccountStatus } from '@suite-common/wallet-types';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';

interface SolStakingDashboardProps {
    selectedAccount: SelectedAccountStatus;
}

export const SolStakingDashboard = ({ selectedAccount }: SolStakingDashboardProps) => {
    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            // TODO: add solana staking dashboard
            dashboard={<></>}
        />
    );
};
