import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { variables, H3, Icon, useTheme } from '@trezor/components';
import { DashboardSection } from 'src/components/dashboard';
import { Translation, Card, StakingFeature } from 'src/components/suite';
import { Footer } from './components/Footer';
import { useDiscovery } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';

const Flex = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
`;

const Badge = styled.span`
    padding: 9px 8px 8px;
    border-radius: 100px;
    background: ${({ theme }) => theme.BG_LIGHT_GREEN};
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    line-height: 16px;
    max-height: 32px;
`;

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Body = styled.div`
    padding: 36px 20px 0 36px;
`;

const CardTitle = styled(H3)`
    color: ${({ theme }) => theme.TYPE_GREEN};
    line-height: 23px;
`;

const FlexRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 22px 0 18px;
    gap: 68px;
    flex-wrap: wrap;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
        gap: 16px;
    }
`;

const FlexRowChild = styled.div`
    flex: 1 0 200px;
`;

const Divider = styled.div`
    display: flex;
    margin-bottom: 64px;
`;

export const StakeEthCard = () => {
    const theme = useTheme();

    const { discovery } = useDiscovery();
    const { accounts } = useAccounts(discovery);
    const ethAccountWithSufficientBalanceForStaking = accounts.find(
        ({ symbol, formattedBalance }) =>
            symbol === 'eth' && MIN_ETH_AMOUNT_FOR_STAKING.isLessThanOrEqualTo(formattedBalance),
    );
    const isSufficientEthForStaking = Boolean(
        ethAccountWithSufficientBalanceForStaking?.formattedBalance,
    );

    const [isShown, setIsShown] = useState(false);
    const hideSection = () => setIsShown(false);

    useEffect(() => {
        setIsShown(isSufficientEthForStaking);
    }, [isSufficientEthForStaking]);

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
        {
            id: 2,
            icon: <Icon icon="TREND_UP_THIN" size={32} color={theme.TYPE_GREEN} />,
            title: <Translation id="TR_STAKE_ETH_MAXIMIZE_REWARDS" />,
            description: <Translation id="TR_STAKE_ETH_MAXIMIZE_REWARDS_DESC" />,
        },
    ];

    if (!isShown) return null;

    return (
        <>
            <DashboardSection
                heading={
                    <Flex>
                        <Translation id="TR_STAKE_ETH" />
                        <Badge>
                            <Translation id="TR_STAKE_ETH_BADGE" />
                        </Badge>
                    </Flex>
                }
            >
                <StyledCard noPadding>
                    <Body>
                        <CardTitle>
                            <Translation id="TR_STAKE_ETH_CARD_TITLE" />
                            <br />
                            <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                        </CardTitle>

                        <FlexRow>
                            {stakeEthFeatures.map(
                                ({ id, icon, title, description, extraDescription }) => (
                                    <FlexRowChild key={id}>
                                        <StakingFeature
                                            icon={icon}
                                            title={title}
                                            description={description}
                                            extraDescription={extraDescription}
                                        />
                                    </FlexRowChild>
                                ),
                            )}
                        </FlexRow>
                    </Body>

                    <Footer
                        accountIndex={ethAccountWithSufficientBalanceForStaking?.index}
                        hideSection={hideSection}
                    />
                </StyledCard>
            </DashboardSection>

            <Divider />
        </>
    );
};
