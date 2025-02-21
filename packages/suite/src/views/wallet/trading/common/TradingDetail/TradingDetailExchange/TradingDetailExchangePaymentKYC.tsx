import { ExchangeProviderInfo } from 'invity-api';
import styled from 'styled-components';

import { Button, H4, Image } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { TradingTransactionId } from 'src/views/wallet/trading/common/TradingTransactionId';

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

interface PaymentKYCProps {
    transactionId?: string;
    supportUrl?: string;
    provider?: ExchangeProviderInfo;
    account: Account;
}

export const TradingDetailExchangePaymentKYC = ({
    transactionId,
    supportUrl,
    provider,
    account,
}: PaymentKYCProps) => {
    const dispatch = useDispatch();

    const goToExchange = () =>
        dispatch(
            goto('wallet-trading-exchange', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Wrapper>
            <Image image="UNI_WARNING" />
            <H4 data-testid="@trading/transaction/detail/status" margin={{ top: spacings.xl }}>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TITLE" />
            </H4>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TEXT" />
            </Description>
            {transactionId && <TradingTransactionId transactionId={transactionId} />}
            {supportUrl && (
                <Button
                    variant="tertiary"
                    href={supportUrl}
                    target="_blank"
                    margin={{ top: spacings.xxs, bottom: spacings.lg }}
                >
                    <Translation id="TR_EXCHANGE_DETAIL_KYC_SUPPORT" />
                </Button>
            )}
            {provider?.kycUrl && (
                <Button variant="tertiary" href={provider?.kycUrl} target="_blank">
                    <Translation id="TR_EXCHANGE_DETAIL_KYC_INFO_LINK" />
                </Button>
            )}
            <Button onClick={goToExchange}>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_BUTTON" />
            </Button>
        </Wrapper>
    );
};
