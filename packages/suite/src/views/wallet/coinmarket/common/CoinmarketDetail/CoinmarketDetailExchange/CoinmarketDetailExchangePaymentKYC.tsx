import styled from 'styled-components';
import { ExchangeProviderInfo } from 'invity-api';

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

interface PaymentKYCProps {
    transactionId?: string;
    supportUrl?: string;
    provider?: ExchangeProviderInfo;
    account: Account;
}

export const CoinmarketDetailExchangePaymentKYC = ({
    transactionId,
    supportUrl,
    provider,
    account,
}: PaymentKYCProps) => {
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
            <Image image="UNI_WARNING" />
            <H4 margin={{ top: spacings.xl }}>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TITLE" />
            </H4>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
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
