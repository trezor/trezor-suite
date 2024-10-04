import styled from 'styled-components';

import { Button, variables, Link, Image } from '@trezor/components';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { goto } from 'src/actions/suite/routerActions';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common/CoinmarketTransactionId';

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
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px;
    max-width: 310px;
    text-align: center;
`;

const LinkWrapper = styled.div`
    margin-top: ${spacingsPx.xxl};
    margin-bottom: ${spacingsPx.xxl};
`;

interface PaymentFailedProps {
    transactionId?: string;
    supportUrl?: string;
    account: Account;
}

export const CoinmarketDetailExchangePaymentFailed = ({
    transactionId,
    supportUrl,
    account,
}: PaymentFailedProps) => {
    const dispatch = useDispatch();

    const goToExchange = () =>
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
            <Image image="UNI_ERROR" />
            <Title>
                <Translation id="TR_EXCHANGE_DETAIL_ERROR_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_ERROR_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
            {supportUrl && (
                <LinkWrapper>
                    <Link href={supportUrl} target="_blank">
                        <Button variant="tertiary">
                            <Translation id="TR_EXCHANGE_DETAIL_ERROR_SUPPORT" />
                        </Button>
                    </Link>
                </LinkWrapper>
            )}
            <Button onClick={goToExchange}>
                <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
            </Button>
        </Wrapper>
    );
};
