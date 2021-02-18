import * as routerActions from '@suite-actions/routerActions';
import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/build';
import { Button, variables, Link } from '@trezor/components';
import { CoinmarketTransactionId } from '@wallet-components';
import { useActions } from '@suite-hooks/useActions';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components/Translation';
import { ExchangeProviderInfo } from 'invity-api';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 60px 20px;
    flex-direction: column;
`;

const Image = styled.img``;

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
    margin: 17px 0 10px 0;
    max-width: 310px;
    text-align: center;
`;

const StyledLink = styled(Link)`
    margin-top: 5px;
    margin-bottom: 20px;
`;

interface Props {
    transactionId?: string;
    supportUrl?: string;
    provider?: ExchangeProviderInfo;
    account: Account;
}

const PaymentKYC = ({ transactionId, supportUrl, provider, account }: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <Wrapper>
            <Image src={resolveStaticPath('/images/svg/uni-warning.svg')} />
            <Title>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
            {supportUrl && (
                <StyledLink href={supportUrl} target="_blank">
                    <Button variant="tertiary">
                        <Translation id="TR_EXCHANGE_DETAIL_KYC_SUPPORT" />
                    </Button>
                </StyledLink>
            )}
            {provider?.kycUrl && (
                <Link href={provider?.kycUrl} target="_blank">
                    <Button variant="tertiary">
                        <Translation id="TR_EXCHANGE_DETAIL_KYC_INFO_LINK" />
                    </Button>
                </Link>
            )}
            <Button
                onClick={() =>
                    goto('wallet-coinmarket-exchange', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    })
                }
            >
                <Translation id="TR_EXCHANGE_DETAIL_KYC_BUTTON" />
            </Button>
        </Wrapper>
    );
};

export default PaymentKYC;
