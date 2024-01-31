import styled, { useTheme } from 'styled-components';
import { SellFiatTrade } from 'invity-api';

import { Button, variables, Icon, H3, Card } from '@trezor/components';
import {
    CoinmarketPaymentType,
    CoinmarketProviderInfo,
    CoinmarketTag,
} from 'src/views/wallet/coinmarket/common';
import { QuestionTooltip, Translation } from 'src/components/suite';
import { useCoinmarketSellOffersContext } from 'src/hooks/wallet/useCoinmarketSellOffers';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

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
    text-transform: capitalize;
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

const VerificationInfo = styled.div`
    color: ${({ theme }) => theme.TYPE_BLUE};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export function getQuoteError(quote: SellFiatTrade, amountInCrypto: boolean) {
    if (quote.error) {
        if (amountInCrypto) {
            const cryptoAmount = Number(quote.cryptoStringAmount);
            const symbol = quote.cryptoCurrency;
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

interface QuoteProps {
    className?: string;
    quote: SellFiatTrade;
    amountInCrypto: boolean;
}

export const SellQuote = ({ className, quote, amountInCrypto }: QuoteProps) => {
    const theme = useTheme();
    const { selectQuote, sellInfo, needToRegisterOrVerifyBankAccount } =
        useCoinmarketSellOffersContext();
    const { tag, infoNote } = getTagAndInfoNote(quote);
    const { paymentMethod, paymentMethodName, exchange, error, bankAccounts } = quote;
    if (!exchange || !sellInfo) return null;

    // show bank account verification info if no verified account and no error and BANK_ACCOUNT flow
    const verificationInfo =
        !(bankAccounts && bankAccounts.filter(ba => ba.verified).length > 0) &&
        !quote.error &&
        sellInfo.providerInfos[exchange]?.flow === 'BANK_ACCOUNT';

    return (
        <Card className={className}>
            <Details>
                <Column>
                    {error && <H3>N/A</H3>}
                    {!error && (
                        <H3>
                            {amountInCrypto ? (
                                <CoinmarketFiatAmount
                                    amount={quote.fiatStringAmount}
                                    currency={quote.fiatCurrency}
                                />
                            ) : (
                                <CoinmarketCryptoAmount
                                    amount={quote.cryptoStringAmount}
                                    symbol={cryptoToCoinSymbol(quote.cryptoCurrency!)}
                                />
                            )}
                            <CoinmarketTag tag={tag} />
                        </H3>
                    )}
                </Column>
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
                        <CoinmarketPaymentType
                            method={paymentMethod}
                            methodName={paymentMethodName}
                        >
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
                <Column>
                    {quote.status === 'LOGIN_REQUEST' ? (
                        <StyledButton onClick={() => selectQuote(quote)}>
                            <Translation id="TR_LOGIN_PROCEED" />
                        </StyledButton>
                    ) : (
                        <StyledButton isDisabled={!!quote.error} onClick={() => selectQuote(quote)}>
                            <Translation
                                id={
                                    needToRegisterOrVerifyBankAccount(quote)
                                        ? 'TR_SELL_REGISTER'
                                        : 'TR_SELL_GET_THIS_OFFER'
                                }
                            />
                        </StyledButton>
                    )}
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

            {infoNote && !error && <Footer>{infoNote}</Footer>}
        </Card>
    );
};
