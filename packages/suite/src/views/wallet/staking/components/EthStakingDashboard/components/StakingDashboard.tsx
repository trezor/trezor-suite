import styled from 'styled-components';
import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';
import { Divider, Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { useDaysTo } from 'src/hooks/suite/useDaysTo';
import { StakingCard } from './StakingCard';
import { ApyCard } from './ApyCard';
import { PayoutCard } from './PayoutCard';
import { ClaimCard } from './claim/ClaimCard';
import { Transactions } from './Transactions';
import {
    selectPoolStatsApyData,
    selectPoolStatsNextRewardPayout,
    selectValidatorsQueue,
} from '@suite-common/wallet-core';

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

    const { daysToAddToPool, daysToUnstake } = useDaysTo({
        selectedAccountKey: account?.key ?? '',
        validatorsQueue: data,
    });

    return (
        <>
            <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
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
