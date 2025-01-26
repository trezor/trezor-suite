import styled from 'styled-components';

import { Button, Image, H4 } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { goto } from 'src/actions/suite/routerActions';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common/CoinmarketTransactionId';

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
    transactionId?: string;
    supportUrl?: string;
    account: Account;
}

export const CoinmarketDetailSellPaymentFailed = ({
    transactionId,
    supportUrl,
    account,
}: PaymentFailedProps) => {
    const dispatch = useDispatch();

    const goToSell = () =>
        dispatch(
            goto('wallet-coinmarket-sell', {
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
            <H4 margin={{ top: spacings.xl }}>
                <Translation id="TR_SELL_DETAIL_ERROR_TITLE" />
            </H4>
            <Description>
                <Translation id="TR_SELL_DETAIL_ERROR_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
            {supportUrl && (
                <Button
                    variant="tertiary"
                    href={supportUrl}
                    target="_blank"
                    margin={{ top: spacings.xxl, bottom: spacings.xxl }}
                >
                    <Translation id="TR_SELL_DETAIL_ERROR_SUPPORT" />
                </Button>
            )}
            <Button onClick={goToSell}>
                <Translation id="TR_SELL_DETAIL_ERROR_BUTTON" />
            </Button>
        </Wrapper>
    );
};
