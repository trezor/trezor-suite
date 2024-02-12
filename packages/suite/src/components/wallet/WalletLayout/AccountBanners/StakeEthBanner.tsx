import { useLocation } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { Button, Card, Icon, Paragraph, variables, IconButton } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation, IconBorderedWrapper } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector, useEverstakePoolStats } from 'src/hooks/suite';
import { selectSelectedAccountHasSufficientEthForStaking } from 'src/reducers/wallet/selectedAccountReducer';
import { setFlag } from 'src/actions/suite/suiteActions';

const StyledCard = styled(Card)`
    padding: ${spacingsPx.lg} ${spacingsPx.xxl} ${spacingsPx.lg} ${spacingsPx.md};
    flex-direction: column;
`;

const Flex = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.md};
    flex-wrap: wrap;
`;

const Left = styled.div`
    display: flex;
    gap: ${spacingsPx.sm};
    align-items: center;
    flex-wrap: wrap;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const Title = styled.h4`
    color: ${({ theme }) => theme.textSubdued};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 4px;
`;

const Text = styled.div`
    max-width: 390px;
    line-height: 24px;
`;

export const StakeEthBanner = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { stakeEthBannerClosed } = useSelector(state => state.suite.flags);
    const hasSufficientEthForStaking = useSelector(selectSelectedAccountHasSufficientEthForStaking);
    const { pathname } = useLocation();
    const isShown = !stakeEthBannerClosed && pathname === '/accounts' && hasSufficientEthForStaking;
    const { ethApy } = useEverstakePoolStats();

    const closeBanner = () => {
        dispatch(setFlag('stakeEthBannerClosed', true));
    };

    const goToEthStakingTab = () => {
        dispatch(goto('wallet-staking', { preserveParams: true }));
    };

    if (!isShown) return null;

    return (
        <StyledCard>
            <Flex>
                <Left>
                    <IconBorderedWrapper>
                        <Icon icon="PIGGY_BANK" size={32} color={theme.iconPrimaryDefault} />
                    </IconBorderedWrapper>

                    <Text>
                        <Title>
                            <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                        </Title>
                        <Paragraph>
                            <Translation
                                id="TR_STAKE_ANY_AMOUNT_ETH"
                                values={{ apyPercent: ethApy }}
                            />
                        </Paragraph>
                    </Text>
                </Left>

                <Right>
                    <Button onClick={goToEthStakingTab}>
                        <Translation id="TR_STAKE_LEARN_MORE" />
                    </Button>
                    <IconButton
                        variant="tertiary"
                        icon="CROSS"
                        iconSize={16}
                        onClick={closeBanner}
                    />
                </Right>
            </Flex>
        </StyledCard>
    );
};
