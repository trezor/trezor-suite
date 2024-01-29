import styled from 'styled-components';
import { variables } from '@trezor/components';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';
import { useValidatorsQueue } from 'src/hooks/wallet/useValidatorsQueue';
import { Divider, Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { StakingCard } from './StakingCard';
import { ApyCard } from './ApyCard';
import { PayoutCard } from './PayoutCard';
import { ClaimCard } from './claim/ClaimCard';
import { Transactions } from './Transactions';
import { useEverstakePoolStats } from '../hooks/useEverstakePoolStats';
import { useDaysTo } from '../hooks/useDaysTo';

const FlexCol = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FlexRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    & > div {
        flex: 1 0 205px;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
        gap: 8px;

        & > div {
            flex: 1 0 auto;
        }
    }
`;

export const StakingDashboard = () => {
    const { ethApy, nextRewardPayout } = useEverstakePoolStats();
    const { validatorsQueue, isValidatorsQueueLoading } = useValidatorsQueue();

    const { key: selectedAccountKey } = useSelector(selectSelectedAccount) ?? {};
    const { daysToAddToPool, daysToUnstake } = useDaysTo({
        selectedAccountKey: selectedAccountKey ?? '',
        validatorsQueue,
    });

    return (
        <>
            <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
                <ClaimCard />

                <FlexCol>
                    <StakingCard
                        isValidatorsQueueLoading={isValidatorsQueueLoading}
                        daysToAddToPool={daysToAddToPool}
                        daysToUnstake={daysToUnstake}
                    />

                    <FlexRow>
                        <ApyCard apy={ethApy} />
                        <PayoutCard
                            nextRewardPayout={nextRewardPayout}
                            daysToAddToPool={daysToAddToPool}
                        />
                    </FlexRow>
                </FlexCol>
            </DashboardSection>

            <Divider />

            <Transactions />
        </>
    );
};
