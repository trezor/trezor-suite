import styled from 'styled-components';

import { Button, Image, Paragraph } from '@trezor/components';
import { typography } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.body}
    margin: 17px 0 30px;
    max-width: 310px;
    text-align: center;
`;

interface PaymentSuccessfulProps {
    account: Account;
}

export const TradingDetailBuyPaymentPaymentSuccessful = ({ account }: PaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const handleClick = () =>
        dispatch(
            goto('wallet-trading-buy', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Wrapper>
            <Image image="TRADING_SUCCESS" />
            <Paragraph
                typographyStyle="highlight"
                margin={{ top: 24 }}
                data-testid="@trading/transaction/detail/status"
            >
                <Translation id="TR_BUY_DETAIL_SUCCESS_TITLE" />
            </Paragraph>
            <Description>
                <Translation id="TR_BUY_DETAIL_SUCCESS_TEXT" />
            </Description>
            <Button onClick={handleClick}>
                <Translation id="TR_BUY_DETAIL_SUCCESS_BUTTON" />
            </Button>
        </Wrapper>
    );
};
