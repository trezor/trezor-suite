import * as routerActions from '@suite-actions/routerActions';
import { MAX_WIDTH } from '@suite-constants/layout';
import { useActions, useSelector } from '@suite-hooks';
import { AccountLabeling } from '@suite-components';
import { colors, Icon, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';
import { Route } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${colors.NEUE_BG_LIGHT_GREY};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
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
        padding: 24px 16px 0px 16px;
    }
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
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
                    <Back onClick={() => goto(backRoute, selectedAccount.params)}>
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
