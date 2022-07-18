import React from 'react';
import styled from 'styled-components';
import { Button, variables, Icon, useTheme, H2 } from '@trezor/components';
import { FormattedFiatAmount, QuestionTooltip, Translation } from '@suite-components';
import { ExchangeTrade } from 'invity-api';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { isQuoteError } from '@wallet-utils/coinmarket/exchangeUtils';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { CoinmarketProviderInfo } from '@wallet-components';
import { useSelector, useTranslation } from '@suite-hooks';
import { toFiatCurrency } from '@suite/utils/wallet/fiatConverterUtils';
import BigNumber from 'bignumber.js';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    flex: 1;
    width: 100%;
    min-height: 150px;
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

interface ColumnProps {
    maxWidth?: string;
}

const Column = styled.div<ColumnProps>`
    display: flex;
    padding: 10px 0;
    flex: 1;
    flex-direction: column;
    justify-content: flex-start;
    max-width: ${props => (props.maxWidth ? props.maxWidth : '100%')};
`;

const Heading = styled.div`
    display: flex;
    text-transform: uppercase;
    align-items: center;
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

const ErrorFooter = styled.div`
    display: flex;
    margin: 0 30px;
    padding: 20px 0;
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

const DexFooter = styled.div`
    display: flex;
    margin: 0 30px;
    padding: 20px 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const DexText = styled.div``;

interface Props {
    className?: string;
    quote: ExchangeTrade;
}

function getQuoteError(quote: ExchangeTrade) {
    if (quote.min && Number(quote.sendStringAmount) < quote.min) {
        return (
            <Translation
                id="TR_OFFER_ERROR_MINIMUM_CRYPTO"
                values={{
                    amount: formatCryptoAmount(Number(quote.sendStringAmount)),
                    min: formatCryptoAmount(quote.min),
                    currency: quote.send,
                }}
            />
        );
    }
    if (quote.max && quote.max !== 'NONE' && Number(quote.sendStringAmount) > quote.max) {
        return (
            <Translation
                id="TR_OFFER_ERROR_MAXIMUM_CRYPTO"
                values={{
                    amount: formatCryptoAmount(Number(quote.sendStringAmount)),
                    max: formatCryptoAmount(quote.max),
                    currency: quote.send,
                }}
            />
        );
    }
    return quote.error;
}

const Quote = ({ className, quote }: Props) => {
    const theme = useTheme();
    const { translationString } = useTranslation();

    const { account, selectQuote, exchangeInfo, callInProgress } =
        useCoinmarketExchangeOffersContext();
    const { feePerByte, fiat, localCurrency } = useSelector(state => ({
        feePerByte: state.wallet.coinmarket.composedTransactionInfo.composed?.feePerByte,
        fiat: state.wallet.fiat,
        localCurrency: state.wallet.settings.localCurrency,
    }));

    const hasTag = false;
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
        <Wrapper className={className}>
            <TagRow>{hasTag && <Tag>best offer</Tag>}</TagRow>
            <Main>
                {errorQuote && !noFundsForFeesError && <Left>N/A</Left>}
                {(!errorQuote || noFundsForFeesError) && (
                    <Left>{`${formatCryptoAmount(Number(receiveStringAmount))} ${receive}`}</Left>
                )}
                <Right>
                    <StyledButton
                        isLoading={callInProgress}
                        isDisabled={errorQuote || callInProgress}
                        onClick={() => selectQuote(quote)}
                    >
                        <Translation id="TR_EXCHANGE_GET_THIS_OFFER" />
                    </StyledButton>
                </Right>
            </Main>
            <Details>
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
            </Details>
            {approvalFee && swapFee && localCurrency && (
                <DexFooter>
                    <DexText>
                        <Translation
                            id="TR_EXCHANGE_DEX_OFFER_FEE_INFO"
                            values={{
                                symbol: account.symbol.toUpperCase(),
                                approvalFee: formatCryptoAmount(approvalFee),
                                approvalFeeFiat: approvalFeeFiat ? (
                                    <FormattedFiatAmount
                                        value={approvalFeeFiat}
                                        currency={localCurrency}
                                    />
                                ) : (
                                    ''
                                ),
                                swapFee: formatCryptoAmount(swapFee),
                                swapFeeFiat: swapFeeFiat ? (
                                    <FormattedFiatAmount
                                        value={swapFeeFiat}
                                        currency={localCurrency}
                                    />
                                ) : (
                                    ''
                                ),
                            }}
                        />
                    </DexText>
                </DexFooter>
            )}
            {errorQuote && (
                <ErrorFooter>
                    <IconWrapper>
                        <StyledIcon icon="CROSS" size={12} color={theme.TYPE_RED} />
                    </IconWrapper>
                    <ErrorText>{noFundsForFeesError || getQuoteError(quote)}</ErrorText>
                </ErrorFooter>
            )}
        </Wrapper>
    );
};

export default Quote;
