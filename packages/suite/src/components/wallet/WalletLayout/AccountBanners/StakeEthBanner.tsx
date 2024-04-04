import styled, { useTheme } from 'styled-components';
import { Button, Card, Icon, Paragraph, variables, IconButton } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation, IconBorderedWrapper } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setFlag } from 'src/actions/suite/suiteActions';
import { selectSuiteFlags } from '../../../../reducers/suite/suiteReducer';
import { Account } from '@suite-common/wallet-types';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { isSupportedNetworkSymbol } from '@suite-common/wallet-core/src/stake/stakeTypes';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

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

interface StakeEthBannerProps {
    account: Account;
}

export const StakeEthBanner = ({ account }: StakeEthBannerProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { stakeEthBannerClosed } = useSelector(selectSuiteFlags);
    const isDebug = useSelector(selectIsDebugModeActive);
    const { pathname } = useSelector(state => state.router);
    const ethApy = useSelector(state => selectPoolStatsApyData(state, account.symbol));

    const closeBanner = () => {
        dispatch(setFlag('stakeEthBannerClosed', true));
    };

    const goToEthStakingTab = () => {
        dispatch(goto('wallet-staking', { preserveParams: true }));
    };

    if (
        pathname !== '/accounts' ||
        stakeEthBannerClosed ||
        !account ||
        !isSupportedNetworkSymbol(account.symbol) ||
        (!isDebug && account.symbol === 'eth')
    ) {
        return null;
    }

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
                                values={{
                                    apyPercent: ethApy,
                                    symbol: account?.symbol.toUpperCase(),
                                }}
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
