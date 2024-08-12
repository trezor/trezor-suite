import styled from 'styled-components';
import { Button, variables, Image } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';

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
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 30px;
    max-width: 310px;
    text-align: center;
`;

interface PaymentSuccessfulProps {
    account: Account;
}

const PaymentSuccessful = ({ account }: PaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const handleClick = () =>
        dispatch(
            goto('wallet-coinmarket-exchange', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Wrapper>
            <Image image="COINMARKET_SUCCESS" />
            <Title>
                <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_TEXT" />
            </Description>
            <Button
                data-testid="@coinmarket/exchange/payment/back-to-account"
                onClick={handleClick}
            >
                <Translation id="TR_EXCHANGE_DETAIL_SUCCESS_BUTTON" />
            </Button>
        </Wrapper>
    );
};

export default PaymentSuccessful;
