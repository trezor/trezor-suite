import { useSelector } from 'react-redux';

import { Column, Flex, Grid, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { selectPoolStatsApyData, StakeRootState } from '@suite-common/wallet-core';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { PayoutCard } from '../StakingDashboard/components/PayoutCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { StakingCard } from '../StakingDashboard/components/StakingCard';

interface SolStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const SolStakingDashboard = ({ selectedAccount }: SolStakingDashboardProps) => {
    const { account } = selectedAccount;

    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const apy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, account?.symbol),
    );

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    <DashboardSection
                        heading={
                            <Translation
                                id="TR_STAKE_NETWORK"
                                values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                            />
                        }
                    >
                        <Column alignItems="normal" gap={spacings.sm}>
                            <Grid columns={isBelowLaptop || !canClaim ? 1 : 2} gap={spacings.sm}>
                                <ClaimCard />
                                <Flex direction={canClaim ? 'column' : 'row'} gap={spacings.sm}>
                                    <ApyCard apy={apy} />
                                    <PayoutCard
                                        nextRewardPayout={SOLANA_EPOCH_DAYS}
                                        daysToAddToPool={SOLANA_EPOCH_DAYS}
                                        validatorWithdrawTime={0}
                                    />
                                </Flex>
                            </Grid>
                            <StakingCard
                                isValidatorsQueueLoading={undefined}
                                daysToAddToPool={SOLANA_EPOCH_DAYS}
                                daysToUnstake={SOLANA_EPOCH_DAYS}
                                apy={apy}
                            />
                        </Column>
                    </DashboardSection>
                    {/* TODO: implement Transactions component */}
                    {/* <Transactions /> */}
                </Column>
            }
        />
    );
};
