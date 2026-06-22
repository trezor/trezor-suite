import { Translation } from '@suite/intl';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Column, Row, TextButton } from '@trezor/components';

import { WalletLayout } from 'src/components/wallet';
import { useGuideOpenNode } from 'src/hooks/guide';

import { TronResourcesCard } from './TronResourcesCard/TronResourcesCard';
import { TronStakedCard } from './TronStakedCard';
import { TronUnstakingCard } from './TronUnstakingCard';
import { TronVotingRewardsCard } from './TronVotingRewardsCard';
import { TronWithdrawReadyBanner } from './TronWithdrawReadyBanner';

const TRON_STAKING_GUIDE_PATH = '/earn/staking/tron-trx-staking.md';

interface TronStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const TronStakingDashboard = ({ selectedAccount }: TronStakingDashboardProps) => {
    const { account } = selectedAccount;
    const { openNodeById } = useGuideOpenNode();

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount}>
            <Column
                gap={12}
                alignItems="stretch"
                width="100%"
                maxWidth={560}
                margin={{ horizontal: 'auto' }}
            >
                <TronWithdrawReadyBanner account={account} />
                <TronUnstakingCard account={account} />
                <TronVotingRewardsCard account={account} />
                <TronStakedCard account={account} />
                <TronResourcesCard account={account} />
                <Row justifyContent="center" padding={{ vertical: 20 }}>
                    <TextButton
                        size="small"
                        iconLeft="question"
                        isUnderlined
                        onClick={() => openNodeById(TRON_STAKING_GUIDE_PATH)}
                    >
                        <Translation id="TR_EARN_TRON_HOW_IT_WORKS" />
                    </TextButton>
                </Row>
            </Column>
        </WalletLayout>
    );
};
