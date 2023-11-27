import styled from 'styled-components';
import { Button, H2, Icon, P, useTheme } from '@trezor/components';
import { Card, Translation, StakingFeature } from 'src/components/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch } from 'src/hooks/suite';

const StyledCard = styled(Card)`
    padding: 26px 26px 36px;
    flex-direction: column;
`;

const StyledH2 = styled(H2)`
    margin-bottom: 18px;
`;

const Flex = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
`;

const StyledP = styled(P)`
    margin-top: 8px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const GreenP = styled(P)`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const Header = styled.div`
    padding-bottom: 22px;
`;

const Body = styled.div`
    border-top: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
`;

const FlexRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 26px 0 34px;
    gap: 68px;
    flex-wrap: wrap;
`;

const FlexRowChild = styled.div`
    flex: 1 0 200px;
`;

export const EmptyStakingCard = () => {
    const theme = useTheme();

    const dispatch = useDispatch();
    const openStakingEthInANutshellModal = () =>
        dispatch(openModal({ type: 'stake-eth-in-a-nutshell' }));

    const stakeEthFeatures = [
        {
            id: 0,
            icon: <Icon icon="PIGGY_BANK" size={32} color={theme.TYPE_GREEN} />,
            title: <Translation id="TR_STAKE_ETH_SEE_MONEY_DANCE" />,
            description: (
                <Translation
                    id="TR_STAKE_ETH_SEE_MONEY_DANCE_DESC"
                    values={{
                        apyPercent: 5,
                    }}
                />
            ),
            extraDescription: <Translation id="TR_APY_DESC" />,
        },
        {
            id: 1,
            icon: <Icon icon="LOCK_LAMINATED_OPEN" size={32} color={theme.TYPE_GREEN} />,
            title: <Translation id="TR_STAKE_ETH_LOCK_FUNDS" />,
            description: <Translation id="TR_STAKE_ETH_LOCK_FUNDS_DESC" />,
        },
    ];

    return (
        <div>
            <StyledCard
                customHeader={
                    <StyledH2>
                        <Translation id="TR_STAKE_ETH" />
                    </StyledH2>
                }
            >
                <Header>
                    <Flex>
                        <Icon icon="QUESTION_FILLED" size={11} color={theme.TYPE_GREEN} />

                        <GreenP size="tiny" weight="bold">
                            <Translation id="TR_WHAT_IS_STAKING" />
                        </GreenP>
                    </Flex>
                    <StyledP size="small" weight="medium">
                        <Translation id="TR_STAKING_IS" />
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
                        <Translation id="TR_START_STAKING" />
                    </Button>
                </Body>
            </StyledCard>
        </div>
    );
};
