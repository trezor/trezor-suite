import { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { Button, Card, Column, Icon, Paragraph, Row, Tooltip, variables } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { Translation, StakingFeature } from 'src/components/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { DashboardSection } from 'src/components/dashboard';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

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
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
`;

const FlexRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin: ${spacingsPx.xl} 0 ${spacingsPx.xxl};
    gap: 68px;
    flex-wrap: wrap;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        flex-direction: column;
        gap: 12px;
    }
`;

const FlexRowChild = styled.div`
    flex: 1 0 200px;
`;

const StyledTooltip = styled(Tooltip)`
    width: fit-content;
`;

export const EmptyStakingCard = () => {
    const theme = useTheme();
    const account = useSelector(selectSelectedAccount);
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking();

    const ethApy = useSelector(state => selectPoolStatsApyData(state, account?.symbol));

    const dispatch = useDispatch();
    const openStakingEthInANutshellModal = () => {
        if (!isStakingDisabled) {
            dispatch(openModal({ type: 'stake-eth-in-a-nutshell' }));
        }
    };

    const stakeEthFeatures = useMemo(
        () => [
            {
                id: 0,
                icon: <Icon name="piggyBank" size={32} color={theme.iconPrimaryDefault} />,
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
                icon: <Icon name="lockLaminatedOpen" size={32} color={theme.iconPrimaryDefault} />,
                title: <Translation id="TR_STAKE_ETH_LOCK_FUNDS" />,
                description: <Translation id="TR_STAKE_ETH_LOCK_FUNDS_DESC" />,
            },
            {
                id: 2,
                icon: <Icon name="everstakeLogo" size={32} color={theme.iconEverstake} />,
                title: <Translation id="TR_STAKE_ETH_EVERSTAKE" />,
                description: <Translation id="TR_STAKE_ETH_EVERSTAKE_DESC" />,
            },
        ],
        [ethApy, theme.iconEverstake, theme.iconPrimaryDefault],
    );

    return (
        <DashboardSection heading={<Translation id="TR_STAKE_ETH" />}>
            <Card>
                <Column>
                    <Header>
                        <Row alignItems="center" gap={spacings.xxs}>
                            <Icon
                                name="questionFilled"
                                size={11}
                                color={theme.iconPrimaryDefault}
                            />

                            <GreenP>
                                <Translation id="TR_STAKE_WHAT_IS_STAKING" />
                            </GreenP>
                        </Row>
                        <StyledP>
                            <Translation
                                id="TR_STAKE_STAKING_IS"
                                values={{ symbol: account?.symbol.toUpperCase() }}
                            />
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
                        <StyledTooltip content={stakingMessageContent}>
                            <Button
                                onClick={openStakingEthInANutshellModal}
                                isDisabled={isStakingDisabled}
                                icon={isStakingDisabled ? 'info' : undefined}
                            >
                                <Translation id="TR_STAKE_START_STAKING" />
                            </Button>
                        </StyledTooltip>
                    </Body>
                </Column>
            </Card>
        </DashboardSection>
    );
};
