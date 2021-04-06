import React from 'react';
import styled from 'styled-components';
import { SellFiatTrade, SellProviderInfo } from 'invity-api';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { variables, CoinLogo } from '@trezor/components';
import {
    CoinmarketPaymentType,
    CoinmarketProviderInfo,
    CoinmarketTransactionId,
} from '@wallet-components';
import { Account } from '@wallet-types';
import { Translation, AccountLabeling } from '@suite-components';

interface Props {
    selectedQuote: SellFiatTrade;
    transactionId?: string;
    providers?: {
        [name: string]: SellProviderInfo;
    };
    account: Account;
}

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    margin-bottom: 5px;
    padding: 15px 24px;
    max-width: 340px;
`;

const AccountText = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding-left: 7px;
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 350px;
    margin: 0 0 10px 30px;
    min-height: 200px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 4px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
        margin: 20px 0 10px 0;
        width: 100%;
    }
`;

const LeftColumn = styled.div`
    display: flex;
    flex: 1;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    align-self: center;
`;

const RightColumn = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
`;

const Row = styled.div`
    display: flex;
    margin: 5px 24px;
`;

const Dark = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const RowWithBorder = styled(Row)`
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    margin-bottom: 10px;
    padding-bottom: 10px;
`;

const TransactionIdWrapper = styled.div`
    padding-left: 40px;
    max-width: 350px;
`;

const CoinmarketSellOfferInfo = ({ selectedQuote, transactionId, providers, account }: Props) => {
    const {
        cryptoStringAmount,
        cryptoCurrency,
        exchange,
        paymentMethod,
        fiatCurrency,
        fiatStringAmount,
    } = selectedQuote;

    return (
        <Wrapper>
            <Info>
                <Header>
                    <CoinLogo symbol={account.symbol} size={16} />
                    <AccountText>
                        <AccountLabeling account={account} />
                    </AccountText>
                </Header>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_SELL_SPEND" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>{`${formatCryptoAmount(
                            Number(cryptoStringAmount),
                        )} ${cryptoCurrency}`}</Dark>
                    </RightColumn>
                </Row>
                <RowWithBorder>
                    <LeftColumn>
                        <Translation id="TR_SELL_RECEIVE" />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            {fiatStringAmount} {fiatCurrency}
                        </Dark>
                    </RightColumn>
                </RowWithBorder>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_SELL_PROVIDER" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketProviderInfo exchange={exchange} providers={providers} />
                    </RightColumn>
                </Row>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_SELL_PAID_BY" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketPaymentType method={paymentMethod} />
                    </RightColumn>
                </Row>
            </Info>
            {transactionId && (
                <TransactionIdWrapper>
                    <CoinmarketTransactionId transactionId={transactionId} />
                </TransactionIdWrapper>
            )}
        </Wrapper>
    );
};

export default CoinmarketSellOfferInfo;
