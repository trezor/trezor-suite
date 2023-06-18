import * as routerActions from 'src/actions/suite/routerActions';
import { MAX_WIDTH } from 'src/constants/suite/layout';
import { useActions, useSelector } from 'src/hooks/suite';
import { AccountLabeling } from 'src/components/suite';
import { Icon, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';
import { Route } from 'src/types/suite';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${props => props.theme.BG_LIGHT_GREY};
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Content = styled.div`
    display: flex;
    width: 100%;
    padding: 0 32px;
    min-height: 50px;
    max-width: ${MAX_WIDTH};
    justify-content: space-between;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 12px 16px;
    }
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Right = styled.div`
    display: flex;
    flex: 1;

    justify-content: flex-end;
`;

const Back = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    width: 10px;
    margin-right: 12px;
`;

interface Props {
    backRoute: Route['name'];
}

const CoinmarketTopPanel = ({ backRoute }: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;

    return (
        <Wrapper>
            <Content>
                <Left>
                    <Back
                        onClick={() => goto(backRoute, { params: selectedAccount.params })}
                        data-test="@coinmarket/back"
                    >
                        <StyledIcon icon="ARROW_LEFT" />
                        <AccountLabeling account={account} />
                    </Back>
                </Left>
                <Right />
            </Content>
        </Wrapper>
    );
};

export const CoinmarketBuyTopPanel = () => <CoinmarketTopPanel backRoute="wallet-coinmarket-buy" />;

export const CoinmarketExchangeTopPanel = () => (
    <CoinmarketTopPanel backRoute="wallet-coinmarket-exchange" />
);

export const CoinmarketSellTopPanel = () => (
    <CoinmarketTopPanel backRoute="wallet-coinmarket-sell" />
);

export const CoinmarketP2pTopPanel = () => <CoinmarketTopPanel backRoute="wallet-coinmarket-p2p" />;
