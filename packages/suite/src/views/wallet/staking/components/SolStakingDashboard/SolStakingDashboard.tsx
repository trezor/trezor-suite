import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import {
    StakeRootState,
    selectAccountIsStakingActive,
    selectHasRunningDiscovery,
    selectPoolStatsApyData,
} from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite';
import { useDevice, useLayoutSize, useSelector } from 'src/hooks/suite';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';
import { PayoutCard } from '../StakingDashboard/components/PayoutCard';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
import { RewardsList } from './components/Rewards/RewardsList';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';

interface SolStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const SolStakingDashboard = ({ selectedAccount }: SolStakingDashboardProps) => {
    const { account } = selectedAccount;
    const { device } = useDevice();

    const { isBelowLaptop } = useLayoutSize();
    const isDeviceConnected = device?.connected && device?.available;
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const apy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, account?.symbol),
    );

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    {isStakingActive ? (
                        <DashboardSection
                            heading={
                                <Translation
                                    id="TR_STAKE_NETWORK"
                                    values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                                />
                            }
                        >
                            <Column alignItems="normal" gap={spacings.sm}>
                                {!isDeviceConnected && <ConnectDeviceGenericPromo />}
                                {isDiscoveryRunning && <DiscoveryWarning />}

                                <Grid
                                    columns={isBelowLaptop || !canClaim ? 1 : 2}
                                    gap={spacings.sm}
                                >
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
                                />
                            </Column>
                        </DashboardSection>
                    ) : (
                        <EmptyStakingCard />
                    )}
                    <RewardsList account={account} />
                </Column>
            }
        />
    );
};
