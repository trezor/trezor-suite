import BigNumber from 'bignumber.js';
import styled, { useTheme } from 'styled-components';

import { Button, variables, Icon, H3, Card } from '@trezor/components';
import { FormattedCryptoAmount, QuestionTooltip, Translation } from 'src/components/suite';
import { useFormatters } from '@suite-common/formatters';
import { ExchangeTrade } from 'invity-api';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { getTagAndInfoNote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { isQuoteError } from 'src/utils/wallet/coinmarket/exchangeUtils';
import { useCoinmarketExchangeOffersContext } from 'src/hooks/wallet/useCoinmarketExchangeOffers';
import {
    CoinmarketCryptoAmount,
    CoinmarketProviderInfo,
    CoinmarketTag,
} from 'src/views/wallet/coinmarket/common';

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

interface ColumnProps {
    maxWidth?: string;
}

const Column = styled.div<ColumnProps>`
    display: flex;
    padding: 10px 0;
    flex: 1;
    flex-direction: column;
    justify-content: flex-start;
    max-width: ${({ maxWidth }) => maxWidth ?? '100%'};
`;

const Heading = styled.div`
    display: flex;
    text-transform: capitalize;
    align-items: center;
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
    padding: 20px 0;
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

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const DexFooter = styled.div`
    display: flex;
    margin: 0 30px;
    padding: 20px 0;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

function getQuoteError(quote: ExchangeTrade) {
    const cryptoAmount = Number(quote.sendStringAmount);
    const symbol = quote.send;
    if (quote.min && cryptoAmount < quote.min) {
        return (
            <Translation
                id="TR_OFFER_ERROR_MINIMUM_CRYPTO"
                values={{
                    amount: <CoinmarketCryptoAmount amount={cryptoAmount} symbol={symbol} />,
                    min: <CoinmarketCryptoAmount amount={quote.min} symbol={symbol} />,
                }}
            />
        );
    }
    if (quote.max && quote.max !== 'NONE' && cryptoAmount > quote.max) {
        return (
            <Translation
                id="TR_OFFER_ERROR_MAXIMUM_CRYPTO"
                values={{
                    amount: <CoinmarketCryptoAmount amount={cryptoAmount} symbol={symbol} />,
                    max: <CoinmarketCryptoAmount amount={quote.max} symbol={symbol} />,
                }}
            />
        );
    }
    return quote.error;
}

interface QuoteProps {
    className?: string;
    quote: ExchangeTrade;
}

export const ExchangeQuote = ({ className, quote }: QuoteProps) => {
    const { FiatAmountFormatter } = useFormatters();

    const theme = useTheme();
    const { translationString } = useTranslation();

    const { account, selectQuote, exchangeInfo, callInProgress } =
        useCoinmarketExchangeOffersContext();

    const feePerByte = useSelector(
        state => state.wallet.coinmarket.composedTransactionInfo.composed?.feePerByte,
    );
    const fiat = useSelector(state => state.wallet.fiat);
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);

    const { tag, infoNote } = getTagAndInfoNote(quote);
    const { exchange, receive, receiveStringAmount } = quote;
    let errorQuote = isQuoteError(quote);

    const provider =
        exchangeInfo?.providerInfos && exchange ? exchangeInfo?.providerInfos[exchange] : undefined;

    let noFundsForFeesError;
    let approvalFee: number | undefined;
    let approvalFeeFiat: string | null = null;
    let swapFee: number | undefined;
    let swapFeeFiat: string | null = null;
    if (quote.isDex && quote.approvalGasEstimate && quote.swapGasEstimate && feePerByte) {
        const fiatRates = fiat.coins.find(item => item.symbol === account.symbol);
        approvalFee = quote.approvalGasEstimate * Number(feePerByte) * 1e-9;
        approvalFeeFiat = toFiatCurrency(
            approvalFee.toString(),
            localCurrency,
            fiatRates?.current?.rates,
        );
        swapFee = quote.swapGasEstimate * Number(feePerByte) * 1e-9;
        swapFeeFiat = toFiatCurrency(swapFee.toString(), localCurrency, fiatRates?.current?.rates);

        if (quote.send === account.symbol.toUpperCase() && !errorQuote) {
            // if base currency, it is necessary to check that there is some value left for the fees
            const maxAmount = new BigNumber(account.formattedBalance).minus(approvalFee);
            if (maxAmount.minus(new BigNumber(quote.sendStringAmount || '0')).isNegative()) {
                errorQuote = true;
                noFundsForFeesError = translationString('TR_EXCHANGE_DEX_OFFER_NO_FUNDS_FEES', {
                    max: maxAmount.toString(),
                    symbol: account.symbol.toUpperCase(),
                });
            }
        }
    }

    return (
        <Card className={className}>
            <Details>
                <Column maxWidth="250px">
                    {errorQuote && !noFundsForFeesError && <H3>N/A</H3>}
                    {(!errorQuote || noFundsForFeesError) && (
                        <H3>
                            <FormattedCryptoAmount value={receiveStringAmount} symbol={receive} />
                            <CoinmarketTag tag={tag} />
                        </H3>
                    )}
                </Column>
                <Column maxWidth="250px">
                    <Heading>
                        <Translation id="TR_EXCHANGE_PROVIDER" />
                    </Heading>
                    <Value>
                        <CoinmarketProviderInfo
                            exchange={exchange}
                            providers={exchangeInfo?.providerInfos}
                        />
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        <Translation id="TR_EXCHANGE_KYC" />
                        <StyledQuestionTooltip tooltip="TR_EXCHANGE_KYC_INFO" />
                    </Heading>
                    <Value>{provider?.kycPolicy}</Value>
                </Column>
                <Column>
                    <StyledButton
                        isLoading={callInProgress}
                        isDisabled={errorQuote || callInProgress}
                        onClick={() => selectQuote(quote)}
                        data-test="@coinmarket/exchange/offers/get-this-deal-button"
                    >
                        <Translation id="TR_EXCHANGE_GET_THIS_OFFER" />
                    </StyledButton>
                </Column>
            </Details>
            {approvalFee && swapFee && localCurrency && (
                <DexFooter>
                    <div>
                        <Translation
                            id="TR_EXCHANGE_DEX_OFFER_FEE_INFO"
                            values={{
                                approvalFee: (
                                    <FormattedCryptoAmount
                                        value={approvalFee}
                                        symbol={account.symbol}
                                    />
                                ),
                                approvalFeeFiat: approvalFeeFiat ? (
                                    <FiatAmountFormatter
                                        value={approvalFeeFiat}
                                        currency={localCurrency}
                                    />
                                ) : (
                                    ''
                                ),
                                swapFee: (
                                    <FormattedCryptoAmount
                                        value={swapFee}
                                        symbol={account.symbol}
                                    />
                                ),
                                swapFeeFiat: swapFeeFiat ? (
                                    <FiatAmountFormatter
                                        value={swapFeeFiat}
                                        currency={localCurrency}
                                    />
                                ) : (
                                    ''
                                ),
                            }}
                        />
                    </div>
                </DexFooter>
            )}
            {errorQuote && (
                <ErrorFooter>
                    <IconWrapper>
                        <StyledIcon icon="CROSS" size={12} color={theme.TYPE_RED} />
                    </IconWrapper>
                    <div>{noFundsForFeesError || getQuoteError(quote)}</div>
                </ErrorFooter>
            )}

            {infoNote && !errorQuote && <Footer>{infoNote}</Footer>}
        </Card>
    );
};
