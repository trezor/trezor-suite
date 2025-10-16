import styled from 'styled-components';

import { H4, Image, NewButton } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

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
    margin: 17px 0 10px;
    max-width: 310px;
    text-align: center;
`;

interface PaymentFailedProps {
    supportUrl?: string;
    account: Account;
}

export const TradingDetailBuyPaymentFailed = ({ supportUrl, account }: PaymentFailedProps) => {
    const dispatch = useDispatch();

    const goToBuy = () =>
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
            <Image image="UNI_ERROR" />
            <H4 data-testid="@trading/transaction/detail/status" margin={{ top: spacings.xl }}>
                <Translation id="TR_BUY_DETAIL_ERROR_TITLE" />
            </H4>
            <Description>
                <Translation id="TR_BUY_DETAIL_ERROR_TEXT" />
            </Description>
            {supportUrl && (
                <NewButton
                    intent="neutral"
                    priority="secondary"
                    href={supportUrl}
                    target="_blank"
                    margin={{ top: spacings.xxl }}
                >
                    <Translation id="TR_BUY_DETAIL_ERROR_SUPPORT" />
                </NewButton>
            )}
            <NewButton onClick={goToBuy} margin={{ top: spacings.xxl }}>
                <Translation id="TR_BUY_DETAIL_ERROR_BUTTON" />
            </NewButton>
        </Wrapper>
    );
};
