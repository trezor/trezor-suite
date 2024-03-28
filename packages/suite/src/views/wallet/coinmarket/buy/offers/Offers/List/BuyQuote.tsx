import styled, { useTheme } from 'styled-components';

import { Button, variables, Icon, Card, H3, H2 } from '@trezor/components';
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
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { spacingsPx, typography } from '@trezor/theme';

const Container = styled.div`
    container-type: inline-size;
    display: flex;
    gap: ${spacingsPx.md};
    justify-content: space-between;
    flex-wrap: wrap;
`;
const Details = styled.div`
    display: flex;
    gap: ${spacingsPx.xl};
    flex-wrap: wrap;
    flex: 1;
`;
const Flex = styled.div`
    flex: 1;
    display: flex;
    gap: ${spacingsPx.xl};
    flex-wrap: nowrap;
    @container (width < 500px) {
        flex-wrap: wrap;
    }
`;

const Column = styled.div``;

const CryptoColumn = styled.div`
    flex-basis: 100%;
`;

const ButtonColumn = styled.div`
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;

    @container (width < 650px) {
        justify-content: flex-start;
        flex-basis: 100%;
    }
`;

const Heading = styled.div`
    display: flex;
    white-space: nowrap;
    padding-bottom: ${spacingsPx.xxs};
    ${typography.callout}
`;

const StyledButton = styled(Button)`
    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const Value = styled.div`
    display: flex;
    align-items: center;
    white-space: nowrap;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
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
                                <CoinmarketCryptoAmount
                                    amount={cryptoAmount}
                                    symbol={cryptoToCoinSymbol(symbol!)}
                                />
                            ),
                            min: (
                                <CoinmarketCryptoAmount
                                    amount={quote.minCrypto}
                                    symbol={cryptoToCoinSymbol(symbol!)}
                                />
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
                                <CoinmarketCryptoAmount
                                    amount={cryptoAmount}
                                    symbol={cryptoToCoinSymbol(symbol!)}
                                />
                            ),
                            max: (
                                <CoinmarketCryptoAmount
                                    amount={quote.maxCrypto}
                                    symbol={cryptoToCoinSymbol(symbol!)}
                                />
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
                                    amount={quote.maxFiat}
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
            <Container>
                <Details>
                    <CryptoColumn className="buy-quote-details">
                        {error && <H2>N/A</H2>}
                        {!error && (
                            <H2>
                                {wantCrypto ? (
                                    <CoinmarketFiatAmount
                                        amount={quote.fiatStringAmount}
                                        currency={quote.fiatCurrency}
                                    />
                                ) : (
                                    <CoinmarketCryptoAmount
                                        amount={quote.receiveStringAmount}
                                        symbol={cryptoToCoinSymbol(quote.receiveCurrency!)}
                                    />
                                )}
                                <CoinmarketTag tag={tag} />
                            </H2>
                        )}
                    </CryptoColumn>
                    <Flex>
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
                                <Translation id="TR_BUY_PROVIDER" />
                            </Heading>
                            <Value>
                                <CoinmarketProviderInfo
                                    exchange={exchange}
                                    providers={providersInfo}
                                />
                            </Value>
                        </Column>
                    </Flex>
                </Details>
                <ButtonColumn>
                    <Value>
                        {quote.status === 'LOGIN_REQUEST' ? (
                            <StyledButton size="small" onClick={() => selectQuote(quote)}>
                                <Translation id="TR_LOGIN_PROCEED" />
                            </StyledButton>
                        ) : (
                            <StyledButton
                                isDisabled={!!quote.error}
                                onClick={() => selectQuote(quote)}
                                data-test="@coinmarket/buy/offers/get-this-deal-button"
                                size="small"
                            >
                                <Translation id="TR_BUY_GET_THIS_OFFER" />
                            </StyledButton>
                        )}
                    </Value>
                </ButtonColumn>
            </Container>
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
