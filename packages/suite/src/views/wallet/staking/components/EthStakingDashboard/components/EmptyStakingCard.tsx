import { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { Button, Card, Icon, Paragraph } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation, StakingFeature } from 'src/components/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useEverstakePoolStats } from 'src/hooks/suite';
import { DashboardSection } from 'src/components/dashboard';

const StyledCard = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.xxl};
    flex-direction: column;
`;

const Flex = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    align-items: center;
`;

const StyledP = styled(Paragraph)`
    margin-top: ${spacingsPx.xs};
    color: ${({ theme }) => theme.textSubdued};
`;

const GreenP = styled(Paragraph)`
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const Header = styled.div`
    padding-bottom: ${spacingsPx.xl};
`;

const Body = styled.div`
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation1};
`;

const FlexRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin: ${spacingsPx.xl} 0 ${spacingsPx.xxl};
    gap: 68px;
    flex-wrap: wrap;
`;

const FlexRowChild = styled.div`
    flex: 1 0 200px;
`;

export const EmptyStakingCard = () => {
    const theme = useTheme();
    const { ethApy } = useEverstakePoolStats();

    const dispatch = useDispatch();
    const openStakingEthInANutshellModal = () =>
        dispatch(openModal({ type: 'stake-eth-in-a-nutshell' }));

    const stakeEthFeatures = useMemo(
        () => [
            {
                id: 0,
                icon: <Icon icon="PIGGY_BANK" size={32} color={theme.iconPrimaryDefault} />,
                title: <Translation id="TR_STAKE_ETH_SEE_MONEY_DANCE" />,
                description: (
                    <Translation
                        id="TR_STAKE_ETH_SEE_MONEY_DANCE_DESC"
                        values={{
                            apyPercent: ethApy,
                        }}
                    />
                ),
                extraDescription: <Translation id="TR_STAKE_APY_DESC" />,
            },
            {
                id: 1,
                icon: (
                    <Icon icon="LOCK_LAMINATED_OPEN" size={32} color={theme.iconPrimaryDefault} />
                ),
                title: <Translation id="TR_STAKE_ETH_LOCK_FUNDS" />,
                description: <Translation id="TR_STAKE_ETH_LOCK_FUNDS_DESC" />,
            },
        ],
        [ethApy, theme.iconPrimaryDefault],
    );

    return (
        <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
            <StyledCard>
                <Header>
                    <Flex>
                        <Icon icon="QUESTION_FILLED" size={11} color={theme.iconPrimaryDefault} />

                        <GreenP>
                            <Translation id="TR_STAKE_WHAT_IS_STAKING" />
                        </GreenP>
                    </Flex>
                    <StyledP>
                        <Translation id="TR_STAKE_STAKING_IS" />
                    </StyledP>
                </Header>

                <Body>
                    <FlexRow>
                        {stakeEthFeatures.map(
                            ({ id, icon, title, description, extraDescription }) => (
                                <FlexRowChild key={id}>
                                    <StakingFeature
                                        icon={icon}
                                        title={title}
                                        titleSize="small"
                                        description={description}
                                        extraDescription={extraDescription}
                                    />
                                </FlexRowChild>
                            ),
                        )}
                    </FlexRow>

                    {/* TODO: Add arrow line down icon. Export from Figma isn't handled as is it should by the strokes to fills online converter */}
                    <Button onClick={openStakingEthInANutshellModal}>
                        <Translation id="TR_STAKE_START_STAKING" />
                    </Button>
                </Body>
            </StyledCard>
        </DashboardSection>
    );
};
