import styled from 'styled-components';
import { BuyTrade, SellFiatTrade } from 'invity-api';
import { variables } from '@trezor/components';
import {
    CoinmarketPaymentType,
    CoinmarketProviderInfo,
    CoinmarketTransactionId,
} from 'src/views/wallet/coinmarket/common';
import { Translation } from 'src/components/suite';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';
import {
    cryptoToCoinSymbol,
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    CoinmarketGetCryptoQuoteAmountProps,
    CoinmarketGetProvidersInfoProps,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketCoinImage } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';

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
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin-bottom: 5px;
    padding: 15px 24px;
    max-width: 340px;
`;

const AccountText = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    padding-left: 7px;
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 350px;
    margin: 0 0 10px 30px;
    min-height: 200px;
    border: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    border-radius: 4px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
        margin: 20px 0 10px;
        width: 100%;
    }
`;

const LeftColumn = styled.div`
    display: flex;
    flex: 1;
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
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
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
`;

const RowWithBorder = styled(Row)`
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin-bottom: 10px;
    padding-bottom: 10px;
`;

const Amount = styled.span`
    padding-left: 5px;
`;

const TransactionIdWrapper = styled.div`
    padding-left: 40px;
    max-width: 350px;
`;

interface CoinmarketSelectedOfferInfoProps {
    selectedQuote: BuyTrade | SellFiatTrade; // TODO: exchange
    transactionId?: string;
    providers: CoinmarketGetProvidersInfoProps;
    quoteAmounts: CoinmarketGetCryptoQuoteAmountProps | null;
    type: CoinmarketTradeType;
}

export const CoinmarketSelectedOfferInfo = ({
    selectedQuote,
    transactionId,
    providers,
    quoteAmounts,
    type,
}: CoinmarketSelectedOfferInfoProps) => {
    const { exchange, paymentMethod, paymentMethodName, fiatCurrency, fiatStringAmount } =
        selectedQuote;

    const currency = quoteAmounts?.receiveCurrency
        ? cryptoToCoinSymbol(quoteAmounts.receiveCurrency)
        : undefined;
    const network =
        quoteAmounts?.receiveCurrency && isCryptoSymbolToken(quoteAmounts.receiveCurrency)
            ? cryptoToNetworkSymbol(quoteAmounts.receiveCurrency)?.toUpperCase()
            : null;
    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto: true });

    return (
        <Wrapper data-testid="@coinmarket/offer/info">
            <Info>
                <Header>
                    <CoinmarketCoinImage symbol={currency} size="large" />
                    <AccountText>
                        {network ? (
                            <Translation
                                id="TR_COINMARKET_TOKEN_NETWORK"
                                values={{
                                    tokenName: currency,
                                    networkName: network,
                                }}
                            />
                        ) : (
                            currency
                        )}
                    </AccountText>
                </Header>
                <Row>
                    <LeftColumn>
                        <Translation id={amountLabels.label2} />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            <CoinmarketFiatAmount
                                amount={fiatStringAmount}
                                currency={fiatCurrency}
                            />
                        </Dark>
                    </RightColumn>
                </Row>
                <RowWithBorder>
                    <LeftColumn>
                        <Translation id={amountLabels.label1} />
                    </LeftColumn>
                    <RightColumn>
                        <Dark>
                            <CoinmarketCoinImage symbol={currency} />
                            <Amount>
                                <CoinmarketCryptoAmount
                                    amount={quoteAmounts?.receiveAmount}
                                    symbol={currency}
                                />
                            </Amount>
                        </Dark>
                    </RightColumn>
                </RowWithBorder>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_BUY_PROVIDER" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketProviderInfo exchange={exchange} providers={providers} />
                    </RightColumn>
                </Row>
                <Row>
                    <LeftColumn>
                        <Translation id="TR_BUY_PAID_BY" />
                    </LeftColumn>
                    <RightColumn>
                        <CoinmarketPaymentType
                            method={paymentMethod}
                            methodName={paymentMethodName}
                        />
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
