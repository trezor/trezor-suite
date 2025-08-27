import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';

interface NewCardanoStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const NewCardanoStakingDashboard = ({
    selectedAccount,
}: NewCardanoStakingDashboardProps) => {
    const { account } = selectedAccount;

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    {!isStakingActive && <EmptyStakingCard />}
                </Column>
            }
        />
    );
};
