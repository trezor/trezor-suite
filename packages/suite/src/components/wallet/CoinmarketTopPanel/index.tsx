import styled from 'styled-components';
import { colors, variables, Icon } from '@trezor/components';
import { ProvidedByInvity } from '@wallet-components';
import React from 'react';
import { useActions, useSelector } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { MAX_WIDTH } from '@suite-constants/layout';

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
`;

const Right = styled.div`
    display: flex;
    flex: 1;

    justify-content: flex-end;
`;

const Back = styled.div`
    display: flex;
    align-items: center;
`;

const CoinmarketTopPanel = () => {
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
                        onClick={() =>
                            goto('wallet-index', {
                                symbol: account.symbol,
                                accountIndex: account.index,
                                accountType: account.accountType,
                            })
                        }
                    >
                        <Icon icon="ARROW_LEFT" />
                        {/* Account #${account.index} */}
                        Account
                    </Back>
                </Left>
                <Right>
                    <ProvidedByInvity />
                </Right>
            </Content>
        </Wrapper>
    );
};

export default CoinmarketTopPanel;
