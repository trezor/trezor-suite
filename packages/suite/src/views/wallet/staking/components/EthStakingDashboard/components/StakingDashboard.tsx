import styled from 'styled-components';
import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';
import { Divider, Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { StakingCard } from './StakingCard';
import { ApyCard } from './ApyCard';
import { PayoutCard } from './PayoutCard';
import { ClaimCard } from './claim/ClaimCard';
import { Transactions } from './Transactions';
import {
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
    selectPoolStatsApyData,
    selectPoolStatsNextRewardPayout,
    selectValidatorsQueue,
} from '@suite-common/wallet-core';
import { getDaysToAddToPool, getDaysToUnstake } from 'src/utils/suite/stake';
import { InstantStakeBanner } from './InstantStakeBanner';
import { useMemo } from 'react';

const FlexCol = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

const FlexRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.xs};

    & > div {
        flex: 1 0 205px;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
        gap: ${spacingsPx.xs};

        & > div {
            flex: 1 0 auto;
        }
    }
`;

export const StakingDashboard = () => {
    const account = useSelector(selectSelectedAccount);

    const { data, isLoading } =
        useSelector(state => selectValidatorsQueue(state, account?.symbol)) || {};

    const ethApy = useSelector(state => selectPoolStatsApyData(state, account?.symbol));
    const nextRewardPayout = useSelector(state =>
        selectPoolStatsNextRewardPayout(state, account?.symbol),
    );

    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, account?.key ?? ''),
    );
    const unstakeTxs = useSelector(state =>
        selectAccountUnstakeTransactions(state, account?.key ?? ''),
    );

    const txs = useMemo(() => [...stakeTxs, ...unstakeTxs], [stakeTxs, unstakeTxs]);

    const daysToAddToPool = getDaysToAddToPool(stakeTxs, data);
    const daysToUnstake = getDaysToUnstake(unstakeTxs, data);

    return (
        <>
            <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
                <InstantStakeBanner
                    txs={txs}
                    daysToAddToPool={daysToAddToPool}
                    daysToUnstake={daysToUnstake}
                />

                <ClaimCard />

                <FlexCol>
                    <StakingCard
                        isValidatorsQueueLoading={isLoading}
                        daysToAddToPool={daysToAddToPool}
                        daysToUnstake={daysToUnstake}
                    />

                    <FlexRow>
                        <ApyCard apy={ethApy} />
                        <PayoutCard
                            nextRewardPayout={nextRewardPayout}
                            daysToAddToPool={daysToAddToPool}
                            validatorWithdrawTime={data?.validatorWithdrawTime}
                        />
                    </FlexRow>
                </FlexCol>
            </DashboardSection>

            <Divider />

            <Transactions />
        </>
    );
};
