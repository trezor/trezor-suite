import React from 'react';
import styled from 'styled-components';
import { useTheme, Button, variables, Icon, H2 } from '@trezor/components';
import { CoinmarketPaymentType, CoinmarketProviderInfo, CoinmarketTag } from '@wallet-components';
import { FormattedCryptoAmount, QuestionTooltip, Translation } from '@suite-components';
import { BuyTrade } from 'invity-api';
import { useCoinmarketBuyOffersContext } from '@wallet-hooks/useCoinmarketBuyOffers';
import { getTagAndInfoNote } from '@wallet-utils/coinmarket/coinmarketUtils';

interface Props {
    className?: string;
    quote: BuyTrade;
    wantCrypto: boolean;
}

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    flex: 1;
    width: 100%;
    min-height: 150px;
    padding-bottom: 16px;
    background: ${props => props.theme.BG_WHITE};
`;

const Main = styled.div`
    display: flex;
    margin: 0 30px;
    justify-content: space-between;
    padding: 20px 0;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        margin: 0 20px;
    }
`;

const Left = styled(H2)`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const Right = styled.div`
    display: flex;
    justify-content: flex-end;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        justify-content: center;
        padding-top: 10px;
    }
`;

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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Footer = styled.div`
    margin: 0 30px;
    padding: 10px 0;
    padding-top: 23px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
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
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    color: ${props => props.theme.TYPE_RED};

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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

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
                            amount: <FormattedCryptoAmount value={cryptoAmount} symbol={symbol} />,
                            min: <FormattedCryptoAmount value={quote.minCrypto} symbol={symbol} />,
                        }}
                    />
                );
            }
            if (quote.maxCrypto && cryptoAmount > quote.maxCrypto) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MAXIMUM_CRYPTO"
                        values={{
                            amount: <FormattedCryptoAmount value={cryptoAmount} symbol={symbol} />,
                            max: <FormattedCryptoAmount value={quote.maxCrypto} symbol={symbol} />,
                        }}
                    />
                );
            }
        } else {
            if (quote.minFiat && Number(quote.fiatStringAmount) < quote.minFiat) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MINIMUM_FIAT"
                        values={{
                            amount: quote.fiatStringAmount,
                            min: quote.minFiat,
                            currency: quote.fiatCurrency,
                        }}
                    />
                );
            }
            if (quote.maxFiat && Number(quote.fiatStringAmount) > quote.maxFiat) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MAXIMUM_FIAT"
                        values={{
                            amount: quote.fiatStringAmount,
                            max: quote.maxFiat,
                            currency: quote.fiatCurrency,
                        }}
                    />
                );
            }
        }
        return quote.error;
    }
    return '';
}

const Quote = ({ className, quote, wantCrypto }: Props) => {
    const theme = useTheme();
    const { selectQuote, providersInfo } = useCoinmarketBuyOffersContext();
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const { paymentMethod, exchange, error } = quote;

    return (
        <Wrapper className={className}>
            <Main>
                {error && <Left>N/A</Left>}
                {!error && (
                    <Left>
                        {wantCrypto ? (
                            `${quote.fiatStringAmount} ${quote.fiatCurrency}`
                        ) : (
                            <FormattedCryptoAmount
                                value={quote.receiveStringAmount}
                                symbol={quote.receiveCurrency}
                            />
                        )}
                        <CoinmarketTag tag={tag} />
                    </Left>
                )}
                <Right>
                    <StyledButton isDisabled={!!quote.error} onClick={() => selectQuote(quote)}>
                        <Translation id="TR_BUY_GET_THIS_OFFER" />
                    </StyledButton>
                </Right>
            </Main>
            <Details>
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
                        <CoinmarketPaymentType method={paymentMethod} />
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
        </Wrapper>
    );
};

export default Quote;
