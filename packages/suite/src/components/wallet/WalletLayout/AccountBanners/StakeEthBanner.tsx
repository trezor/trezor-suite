import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Icon, P, useTheme, variables } from '@trezor/components';
import { Card, Translation, CircleBorder } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccountHasSufficientEthForStaking } from 'src/reducers/wallet/selectedAccountReducer';
import { setFlag } from 'src/actions/suite/suiteActions';

const StyledCard = styled(Card)`
    padding: 18px 32px 18px 14px;
    flex-direction: column;
`;

const Flex = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
`;

const Left = styled.div`
    display: flex;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Title = styled.h4`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 4px;
`;

const Text = styled.div`
    max-width: 370px;
    line-height: 24px;
`;

const TertiaryButton = styled(Button)`
    width: 38px;
    height: 38px;
`;

export const StakeEthBanner = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { stakeEthBannerClosed } = useSelector(state => state.suite.flags);
    const hasSufficientEthForStaking = useSelector(selectSelectedAccountHasSufficientEthForStaking);
    const { pathname } = useLocation();
    const isShown = !stakeEthBannerClosed && pathname === '/accounts' && hasSufficientEthForStaking;

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
                    <CircleBorder>
                        <Icon icon="PIGGY_BANK" size={32} color={theme.TYPE_GREEN} />
                    </CircleBorder>

                    <Text>
                        <Title>
                            <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                        </Title>
                        <P weight="medium">
                            <Translation id="TR_STAKE_ANY_AMOUNT_ETH" />
                        </P>
                    </Text>
                </Left>

                <Right>
                    <Button onClick={goToEthStakingTab}>
                        <Translation id="TR_STAKE_ETH_LEARN_MORE" />
                    </Button>
                    <TertiaryButton
                        icon="CROSS"
                        variant="tertiary"
                        size={16}
                        onClick={closeBanner}
                    />
                </Right>
            </Flex>
        </StyledCard>
    );
};
