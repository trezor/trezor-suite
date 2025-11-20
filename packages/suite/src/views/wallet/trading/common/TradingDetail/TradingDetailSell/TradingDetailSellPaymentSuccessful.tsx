import styled from 'styled-components';

import { Button, Image, Paragraph } from '@trezor/components';
import { borders, typography } from '@trezor/theme';

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

const FixedRate = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${({ theme }) => theme.backgroundNeutralBoldInverted};
    padding: 14px 18px;
    border-radius: ${borders.radii.xs};
    margin-bottom: 30px;
`;

interface PaymentSuccessfulProps {
    account: Account;
}

export const TradingDetailSellPaymentSuccessful = ({ account }: PaymentSuccessfulProps) => {
    const dispatch = useDispatch();

    const goToSell = () =>
        dispatch(
            goto('wallet-trading-sell', {
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
                typographyStyle="body"
                margin={{ top: 24 }}
                data-testid="@trading/transaction/detail/status"
            >
                <Translation id="TR_SELL_DETAIL_SUCCESS_TITLE" />
            </Paragraph>
            <Description>
                <Translation id="TR_SELL_DETAIL_SUCCESS_TEXT" />
            </Description>
            <FixedRate>
                <Paragraph typographyStyle="callout">
                    <Translation id="TR_SELL_DETAIL_SUCCESS_FIXED_RATE_HEADER" />
                </Paragraph>
                <Paragraph variant="tertiary">
                    <Translation id="TR_SELL_DETAIL_SUCCESS_FIXED_RATE_MESSAGE" />
                </Paragraph>
            </FixedRate>
            <Button onClick={goToSell}>
                <Translation id="TR_SELL_DETAIL_SUCCESS_BUTTON" />
            </Button>
        </Wrapper>
    );
};
