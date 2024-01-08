import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Divider, Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { StakingCard } from './StakingCard';
import { ApyCard } from './ApyCard';
import { PayoutCard } from './PayoutCard';
import { ClaimCard } from './claim/ClaimCard';
import { Transactions } from './Transactions';

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

export const StakingDashboard = () => (
    <>
        <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
            <ClaimCard />

            <FlexCol>
                <StakingCard />

                <FlexRow>
                    <ApyCard />
                    <PayoutCard />
                </FlexRow>
            </FlexCol>
        </DashboardSection>

        <Divider />

        <Transactions />
    </>
);
