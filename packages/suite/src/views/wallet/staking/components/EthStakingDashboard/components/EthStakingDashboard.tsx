import { useEffect, useMemo } from 'react';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    fetchAllTransactionsForAccountThunk,
    selectAccountIsStakingActive,
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
    selectPoolStatsApyData,
    selectPoolStatsNextRewardPayout,
    selectValidatorsQueue,
} from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Column, Flex, Grid, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { getDaysToAddToPool, getDaysToUnstake } from 'src/utils/suite/ethereumStaking';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

import { InstantStakeBanner } from './InstantStakeBanner';
import { StakingDashboard } from '../../StakingDashboard/StakingDashboard';
import { ApyCard } from '../../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../../StakingDashboard/components/ClaimCard';
import { EmptyStakingCard } from '../../StakingDashboard/components/EmptyStakingCard';
import { PayoutCard } from '../../StakingDashboard/components/PayoutCard';
import { StakingCard } from '../../StakingDashboard/components/StakingCard';
import { Transactions } from '../../StakingDashboard/components/Transactions';

interface EthStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const EthStakingDashboard = ({ selectedAccount }: EthStakingDashboardProps) => {
    const { account } = selectedAccount;
    const { device } = useDevice();

    const accountKey = account?.key ?? '';
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);
    const isDeviceConnected = device?.connected && device?.available;

    const { data, isLoading } =
        useSelector(state => selectValidatorsQueue(state, account?.symbol)) || {};

    const apy = useSelector(state => selectPoolStatsApyData(state, account?.symbol));
    const nextRewardPayout = useSelector(state =>
        selectPoolStatsNextRewardPayout(state, account?.symbol),
    );

    const stakeTxs = useSelector(state => selectAccountStakeTransactions(state, accountKey));
    const unstakeTxs = useSelector(state => selectAccountUnstakeTransactions(state, accountKey));

    const dispatch = useDispatch();

    useEffect(() => {
        if (accountKey) {
            dispatch(
                fetchAllTransactionsForAccountThunk({
                    accountKey,
                    noLoading: true,
                }),
            );
        }
    }, [account, accountKey, dispatch]);

    const txs = useMemo(() => [...stakeTxs, ...unstakeTxs], [stakeTxs, unstakeTxs]);

    const daysToAddToPool = getDaysToAddToPool(stakeTxs, data);
    const daysToUnstake = getDaysToUnstake(unstakeTxs, data);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column gap={spacings.xxxxl}>
                    {isStakingActive ? (
                        <DashboardSection
                            heading={
                                <Translation
                                    id="TR_STAKE_NETWORK"
                                    values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                                />
                            }
                        >
                            <Column gap={spacings.sm}>
                                {!isDeviceConnected && <ConnectDeviceGenericPromo />}

                                <InstantStakeBanner
                                    txs={txs}
                                    daysToAddToPool={daysToAddToPool}
                                    daysToUnstake={daysToUnstake}
                                />
                                <Grid
                                    columns={isBelowLaptop || !canClaim ? 1 : 2}
                                    gap={spacings.sm}
                                >
                                    <ClaimCard />
                                    <Flex direction={canClaim ? 'column' : 'row'} gap={spacings.sm}>
                                        <ApyCard apy={apy} />
                                        <PayoutCard
                                            nextRewardPayout={nextRewardPayout}
                                            daysToAddToPool={daysToAddToPool}
                                            validatorWithdrawTime={data?.validatorWithdrawTime}
                                        />
                                    </Flex>
                                </Grid>
                                <StakingCard
                                    isValidatorsQueueLoading={isLoading}
                                    daysToAddToPool={daysToAddToPool}
                                    daysToUnstake={daysToUnstake}
                                />
                            </Column>
                        </DashboardSection>
                    ) : (
                        <EmptyStakingCard />
                    )}

                    <Transactions />
                </Column>
            }
        />
    );
};
