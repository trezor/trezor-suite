import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { CARDANO_EPOCH_DAYS } from '@suite-common/wallet-constants';
import {
    StakeRootState,
    hasPendingStakeTypeTransaction,
    selectAccountIsStakingActive,
    selectHasRunningDiscovery,
    selectPoolStatsApyData,
} from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork, isCardanoStakedWithEverstake } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite/Translation';
import { useDevice, useLayoutSize, useSelector } from 'src/hooks/suite';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

import { CardanoNewProviderCard } from '../CardanoNewProviderCard';
import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';
import { PayoutCard } from '../StakingDashboard/components/PayoutCard';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
interface NewCardanoStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const NewCardanoStakingDashboard = ({
    selectedAccount,
}: NewCardanoStakingDashboardProps) => {
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
    const hasPendingTx = useSelector(state => hasPendingStakeTypeTransaction(state, account.key));
    const isStakedWithEverstake = isCardanoStakedWithEverstake(account) || hasPendingTx;

    const shouldShowStakingDashboard = isStakingActive || hasPendingTx;

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    {shouldShowStakingDashboard ? (
                        <DashboardSection
                            heading={
                                <Translation
                                    id="TR_STAKE_STAKE_TOKEN"
                                    values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                                />
                            }
                        >
                            <Column alignItems="normal" gap={spacings.sm}>
                                {!isDeviceConnected && <ConnectDeviceGenericPromo />}
                                {isDiscoveryRunning && <DiscoveryWarning />}

                                <CardanoNewProviderCard account={account} />

                                <Grid
                                    columns={isBelowLaptop || !canClaim ? 1 : 2}
                                    gap={spacings.sm}
                                >
                                    <ClaimCard />
                                    <Flex direction={canClaim ? 'column' : 'row'} gap={spacings.sm}>
                                        <ApyCard apy={isStakedWithEverstake ? apy : undefined} />
                                        <PayoutCard
                                            nextRewardPayout={CARDANO_EPOCH_DAYS}
                                            daysToAddToPool={CARDANO_EPOCH_DAYS}
                                            validatorWithdrawTime={0}
                                        />
                                    </Flex>
                                </Grid>
                                <StakingCard
                                    isValidatorsQueueLoading={undefined}
                                    daysToAddToPool={CARDANO_EPOCH_DAYS}
                                    daysToUnstake={CARDANO_EPOCH_DAYS}
                                />
                            </Column>
                        </DashboardSection>
                    ) : (
                        <EmptyStakingCard />
                    )}
                </Column>
            }
        />
    );
};
