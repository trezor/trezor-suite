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
                            goto('wallet-coinmarket-buy', {
                                symbol: account.symbol,
                                accountIndex: account.index,
                                accountType: account.accountType,
                            })
                        }
                    >
                        <StyledIcon icon="ARROW_LEFT" />
                        {`Account #${account.index + 1}`}
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
