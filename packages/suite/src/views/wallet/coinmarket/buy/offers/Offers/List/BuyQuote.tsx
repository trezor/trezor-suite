import styled, { useTheme } from 'styled-components';

import { Button, variables, Icon, Card, H3 } from '@trezor/components';
import {
    CoinmarketCryptoAmount,
    CoinmarketFiatAmount,
    CoinmarketPaymentType,
    CoinmarketProviderInfo,
    CoinmarketTag,
} from 'src/views/wallet/coinmarket/common';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { BuyTrade } from 'invity-api';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const Details = styled.div`
    display: flex;
    min-height: 20px;
    flex-wrap: wrap;
    padding: 10px 30px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        padding: 10px 20px;
    }
`;

const Column = styled.div`
    display: flex;
    padding: 10px 0;
    flex: 1;
    flex-direction: column;
    justify-content: flex-start;
`;

const Heading = styled.div`
    display: flex;
    text-transform: uppercase;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-bottom: 9px;
`;

const StyledButton = styled(Button)`
    width: 180px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const Value = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Footer = styled.div`
    margin: 0 30px;
    padding: 10px 0;
    padding-top: 23px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 0 20px;
    }
`;

const ErrorFooter = styled.div`
    display: flex;
    margin: 0 30px;
    padding: 10px 0;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_RED};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 0 20px;
    }
`;

const StyledIcon = styled(Icon)`
    padding-top: 8px;
`;

const IconWrapper = styled.div`
    padding-right: 3px;
`;

const ErrorText = styled.div``;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface QuoteProps {
    className?: string;
    quote: BuyTrade;
    wantCrypto: boolean;
}

export function getQuoteError(quote: BuyTrade, wantCrypto: boolean) {
    if (quote.error) {
        if (wantCrypto) {
            const cryptoAmount = Number(quote.receiveStringAmount);
            const symbol = quote.receiveCurrency;
            if (quote.minCrypto && cryptoAmount < quote.minCrypto) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MINIMUM_CRYPTO"
                        values={{
                            amount: (
                                <CoinmarketCryptoAmount amount={cryptoAmount} symbol={symbol} />
                            ),
                            min: (
                                <CoinmarketCryptoAmount amount={quote.minCrypto} symbol={symbol} />
                            ),
                        }}
                    />
                );
            }
            if (quote.maxCrypto && cryptoAmount > quote.maxCrypto) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MAXIMUM_CRYPTO"
                        values={{
                            amount: (
                                <CoinmarketCryptoAmount amount={cryptoAmount} symbol={symbol} />
                            ),
                            max: (
                                <CoinmarketCryptoAmount amount={quote.maxCrypto} symbol={symbol} />
                            ),
                        }}
                    />
                );
            }
        } else {
            const fiatAmount = Number(quote.fiatStringAmount);
            if (quote.minFiat && fiatAmount < quote.minFiat) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MINIMUM_FIAT"
                        values={{
                            amount: (
                                <CoinmarketFiatAmount
                                    amount={fiatAmount}
                                    currency={quote.fiatCurrency}
                                />
                            ),
                            min: (
                                <CoinmarketFiatAmount
                                    amount={quote.minFiat}
                                    currency={quote.fiatCurrency}
                                />
                            ),
                        }}
                    />
                );
            }
            if (quote.maxFiat && fiatAmount > quote.maxFiat) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MAXIMUM_FIAT"
                        values={{
                            amount: (
                                <CoinmarketFiatAmount
                                    amount={fiatAmount}
                                    currency={quote.fiatCurrency}
                                />
                            ),
                            max: (
                                <CoinmarketFiatAmount
                                    amount={quote.minFiat}
                                    currency={quote.fiatCurrency}
                                />
                            ),
                        }}
                    />
                );
            }
        }
        return quote.error;
    }
    return '';
}

export const BuyQuote = ({ className, quote, wantCrypto }: QuoteProps) => {
    const theme = useTheme();
    const { selectQuote, providersInfo } = useCoinmarketBuyOffersContext();
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const { paymentMethod, paymentMethodName, exchange, error } = quote;

    return (
        <Card className={className}>
            <Details>
                <Column>
                    <Value>
                        {error && <H3>N/A</H3>}
                        {!error && (
                            <H3>
                                {wantCrypto ? (
                                    <CoinmarketFiatAmount
                                        amount={quote.fiatStringAmount}
                                        currency={quote.fiatCurrency}
                                    />
                                ) : (
                                    <CoinmarketCryptoAmount
                                        amount={quote.receiveStringAmount}
                                        symbol={quote.receiveCurrency}
                                    />
                                )}
                                <CoinmarketTag tag={tag} />
                            </H3>
                        )}
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        <Translation id="TR_BUY_PROVIDER" />
                    </Heading>
                    <Value>
                        <CoinmarketProviderInfo exchange={exchange} providers={providersInfo} />
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        <Translation id="TR_BUY_PAID_BY" />
                    </Heading>
                    <Value>
                        <CoinmarketPaymentType
                            method={paymentMethod}
                            methodName={paymentMethodName}
                        />
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        <Translation id="TR_BUY_FEES" />{' '}
                        <StyledQuestionTooltip tooltip="TR_OFFER_FEE_INFO" />
                    </Heading>
                    <Value>
                        <Translation id="TR_BUY_ALL_FEES_INCLUDED" />
                    </Value>
                </Column>
                <Column>
                    <Value>
                        {quote.status === 'LOGIN_REQUEST' ? (
                            <StyledButton onClick={() => selectQuote(quote)}>
                                <Translation id="TR_LOGIN_PROCEED" />
                            </StyledButton>
                        ) : (
                            <StyledButton
                                isDisabled={!!quote.error}
                                onClick={() => selectQuote(quote)}
                                data-test="@coinmarket/buy/offers/get-this-deal-button"
                            >
                                <Translation id="TR_BUY_GET_THIS_OFFER" />
                            </StyledButton>
                        )}
                    </Value>
                </Column>
            </Details>
            {error && (
                <ErrorFooter>
                    <IconWrapper>
                        <StyledIcon icon="CROSS" size={12} color={theme.TYPE_RED} />
                    </IconWrapper>
                    <ErrorText>{getQuoteError(quote, wantCrypto)}</ErrorText>
                </ErrorFooter>
            )}

            {infoNote && !error && <Footer>{infoNote}</Footer>}
        </Card>
    );
};
