import { useEffect, useMemo } from 'react';

import { Column, Flex, Grid, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';
import {
    fetchAllTransactionsForAccountThunk,
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
    selectPoolStatsApyData,
    selectPoolStatsNextRewardPayout,
    selectValidatorsQueue,
} from '@suite-common/wallet-core';
import { getAccountEverstakeStakingPool } from '@suite-common/wallet-utils';

import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { getDaysToAddToPool, getDaysToUnstake } from 'src/utils/suite/stake';

import { StakingCard } from './StakingCard';
import { ApyCard } from './ApyCard';
import { PayoutCard } from './PayoutCard';
import { ClaimCard } from './ClaimCard';
import { Transactions } from './Transactions';
import { InstantStakeBanner } from './InstantStakeBanner';

export const StakingDashboard = () => {
    const account = useSelector(selectSelectedAccount);
    const accountKey = account?.key ?? '';
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);

    const { data, isLoading } =
        useSelector(state => selectValidatorsQueue(state, account?.symbol)) || {};

    const ethApy = useSelector(state => selectPoolStatsApyData(state, account?.symbol));
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

    const { canClaim = false } = getAccountEverstakeStakingPool(account) ?? {};

    return (
        <Column alignItems="normal" gap={spacings.xxxxl}>
            <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
                <Column alignItems="normal" gap={spacings.sm}>
                    <InstantStakeBanner
                        txs={txs}
                        daysToAddToPool={daysToAddToPool}
                        daysToUnstake={daysToUnstake}
                    />
                    <Grid columns={isBelowLaptop || !canClaim ? 1 : 2} gap={spacings.sm}>
                        <ClaimCard />
                        <Flex direction={canClaim ? 'column' : 'row'} gap={spacings.sm}>
                            <ApyCard apy={ethApy} />
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

            <Transactions />
        </Column>
    );
};
