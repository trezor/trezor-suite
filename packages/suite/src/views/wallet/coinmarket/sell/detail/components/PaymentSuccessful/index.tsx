import * as routerActions from '@suite-actions/routerActions';
import React from 'react';
import styled from 'styled-components';
import { Button, variables, Image } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 30px;
    max-width: 310px;
    text-align: center;
`;

const FixedRate = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${props => props.theme.BG_GREY};
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 30px;
`;
const FixedRateHeader = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.SMALL};
`;
const FixedRateMessage = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;
interface Props {
    account: Account;
}

const PaymentSuccessful = ({ account }: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <Wrapper>
            <Image image="COINMARKET_SUCCESS" />
            <Title>
                <Translation id="TR_SELL_DETAIL_SUCCESS_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_SELL_DETAIL_SUCCESS_TEXT" />
            </Description>
            <FixedRate>
                <FixedRateHeader>
                    <Translation id="TR_SELL_DETAIL_SUCCESS_FIXED_RATE_HEADER" />
                </FixedRateHeader>
                <FixedRateMessage>
                    <Translation id="TR_SELL_DETAIL_SUCCESS_FIXED_RATE_MESSAGE" />
                </FixedRateMessage>
            </FixedRate>
            <Button
                onClick={() =>
                    goto('wallet-coinmarket-sell', {
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    })
                }
            >
                <Translation id="TR_SELL_DETAIL_SUCCESS_BUTTON" />
            </Button>
        </Wrapper>
    );
};

export default PaymentSuccessful;
