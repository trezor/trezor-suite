import React from 'react';
import styled from 'styled-components';
import { useTheme, Button, variables, Icon, H2 } from '@trezor/components';
import { CoinmarketPaymentType, CoinmarketProviderInfo } from '@wallet-components';
import { QuestionTooltip, Translation } from '@suite-components';
import { SellFiatTrade } from 'invity-api';
import { useCoinmarketSellOffersContext } from '@wallet-hooks/useCoinmarketSellOffers';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';

interface Props {
    className?: string;
    quote: SellFiatTrade;
    amountInCrypto: boolean;
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

const TagRow = styled.div`
    display: flex;
    min-height: 30px;
`;

const Tag = styled.div`
    margin-top: 10px;
    height: 35px;
    margin-left: -20px;
    border: 1px solid tan;
    text-transform: uppercase;
`;

const Main = styled.div`
    display: flex;
    margin: 0 30px;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        margin: 0 20px;
    }
`;

const Left = styled(H2)`
    display: flex;
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

const VerificationInfo = styled.div`
    color: ${props => props.theme.TYPE_BLUE};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

export function getQuoteError(quote: SellFiatTrade, amountInCrypto: boolean) {
    if (quote.error) {
        if (amountInCrypto) {
            const cryptoAmount = Number(quote.cryptoStringAmount);
            if (quote.minCrypto && cryptoAmount < quote.minCrypto) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MINIMUM_CRYPTO"
                        values={{
                            amount: formatCryptoAmount(Number(quote.cryptoStringAmount)),
                            min: formatCryptoAmount(quote.minCrypto),
                            currency: quote.cryptoCurrency,
                        }}
                    />
                );
            }
            if (quote.maxCrypto && cryptoAmount > quote.maxCrypto) {
                return (
                    <Translation
                        id="TR_OFFER_ERROR_MAXIMUM_CRYPTO"
                        values={{
                            amount: formatCryptoAmount(Number(quote.cryptoStringAmount)),
                            max: formatCryptoAmount(quote.maxCrypto),
                            currency: quote.cryptoCurrency,
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
                            amount: quote.fiatStringAmount,
                            min: quote.minFiat,
                            currency: quote.fiatCurrency,
                        }}
                    />
                );
            }
            if (quote.maxFiat && fiatAmount > quote.maxFiat) {
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

const Quote = ({ className, quote, amountInCrypto }: Props) => {
    const theme = useTheme();
    const { selectQuote, sellInfo, needToRegisterOrVerifyBankAccount } =
        useCoinmarketSellOffersContext();
    // TODO - tags are not yet fully supported by the API server
    // in the future will be taken from quote.tags, will need some algorithm to evaluate them and show only one
    const hasTag = false;
    const { paymentMethod, exchange, error, bankAccounts } = quote;
    if (!exchange || !sellInfo) return null;

    // show bank account verification info if no verified account and no error and BANK_ACCOUNT flow
    const verificationInfo =
        !(bankAccounts && bankAccounts.filter(ba => ba.verified).length > 0) &&
        !quote.error &&
        sellInfo.providerInfos[exchange]?.flow === 'BANK_ACCOUNT';

    return (
        <Wrapper className={className}>
            <TagRow>{hasTag && <Tag>best offer</Tag>}</TagRow>
            <Main>
                {error && <Left>N/A</Left>}
                {!error && (
                    <Left>
                        {amountInCrypto
                            ? `${quote.fiatStringAmount} ${quote.fiatCurrency}`
                            : `${formatCryptoAmount(Number(quote.cryptoStringAmount))} ${
                                  quote.cryptoCurrency
                              }`}
                    </Left>
                )}
                <Right>
                    <StyledButton isDisabled={!!quote.error} onClick={() => selectQuote(quote)}>
                        <Translation
                            id={
                                needToRegisterOrVerifyBankAccount(quote)
                                    ? 'TR_SELL_REGISTER'
                                    : 'TR_SELL_GET_THIS_OFFER'
                            }
                        />
                    </StyledButton>
                </Right>
            </Main>
            <Details>
                <Column>
                    <Heading>
                        <Translation id="TR_SELL_PROVIDER" />
                    </Heading>
                    <Value>
                        <CoinmarketProviderInfo
                            exchange={exchange}
                            providers={sellInfo.providerInfos}
                        />
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        <Translation id="TR_SELL_PAID_BY" />
                    </Heading>
                    <Value>
                        <CoinmarketPaymentType method={paymentMethod}>
                            {verificationInfo && (
                                <VerificationInfo>
                                    <Translation id="TR_SELL_BANK_ACCOUNT_VERIFICATION_INFO" />
                                </VerificationInfo>
                            )}
                        </CoinmarketPaymentType>
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        <Translation id="TR_SELL_FEES" />
                        <StyledQuestionTooltip tooltip="TR_OFFER_FEE_INFO" />
                    </Heading>
                    <Value>
                        <Translation id="TR_SELL_ALL_FEES_INCLUDED" />
                    </Value>
                </Column>
            </Details>
            {error && (
                <ErrorFooter>
                    <IconWrapper>
                        <StyledIcon icon="CROSS" size={12} color={theme.TYPE_RED} />
                    </IconWrapper>
                    <ErrorText>{getQuoteError(quote, amountInCrypto)}</ErrorText>
                </ErrorFooter>
            )}

            {quote.infoNote && !error && <Footer>{quote.infoNote}</Footer>}
        </Wrapper>
    );
};

export default Quote;
