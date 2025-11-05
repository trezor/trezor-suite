import styled from 'styled-components';

import { Button, Image, variables } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

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
    color: ${({ theme }) => theme.textSubdued};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 30px;
    max-width: 310px;
    text-align: center;
`;

export const TradingDetailExchangePaymentSuccessful = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('wallet-trading-exchange'));

    return (
        <Wrapper>
            <Image image="TRADING_SUCCESS" />
            <Title data-testid="@trading/transaction/detail/status">
                <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TEXT" />
            </Description>
            <Button data-testid="@trading/exchange/payment/back-to-account" onClick={handleClick}>
                <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_BUTTON" />
            </Button>
        </Wrapper>
    );
};
