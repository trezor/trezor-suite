import * as routerActions from '@suite-actions/routerActions';
import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Button, variables, colors } from '@trezor/components';
import { CoinmarketTransactionId } from '@wallet-components';
import { useActions } from '@suite-hooks/useActions';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components/Translation';

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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px 0;
    max-width: 310px;
    text-align: center;
`;

const Link = styled.a`
    margin-top: 30px;
    margin-bottom: 30px;
`;

interface Props {
    transactionId?: string;
    supportUrl?: string;
    account: Account;
}

const PaymentFailed = ({ transactionId, supportUrl, account }: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <Wrapper>
            <Image src={resolveStaticPath('/images/svg/uni-error.svg')} />
            <Title>
                <Translation id="TR_EXCHANGE_DETAIL_ERROR_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_ERROR_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
            {supportUrl && (
                <Link href={supportUrl} target="_blank">
                    <Button variant="tertiary">
                        <Translation id="TR_EXCHANGE_DETAIL_ERROR_SUPPORT" />
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
                <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
            </Button>
        </Wrapper>
    );
};

export default PaymentFailed;
