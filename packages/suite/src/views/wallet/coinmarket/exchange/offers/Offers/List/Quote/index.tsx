import React from 'react';
import styled from 'styled-components';
import { Button, variables, Icon, useTheme } from '@trezor/components';
import { QuestionTooltip, Translation } from '@suite-components';
import { ExchangeTrade } from 'invity-api';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { isQuoteError } from '@wallet-utils/coinmarket/exchangeUtils';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { CoinmarketProviderInfo } from '@wallet-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
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
`;

const Left = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.H2};
`;

const Right = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Details = styled.div`
    display: flex;
    min-height: 20px;
    flex-wrap: wrap;
    padding: 10px 30px;
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
    const { selectQuote, exchangeInfo, callInProgress } = useCoinmarketExchangeOffersContext();
    const hasTag = false;
    const { exchange, receive, receiveStringAmount } = quote;
    const errorQuote = isQuoteError(quote);

    const provider =
        exchangeInfo?.providerInfos && exchange ? exchangeInfo?.providerInfos[exchange] : undefined;

    return (
        <Wrapper className={className}>
            <TagRow>{hasTag && <Tag>best offer</Tag>}</TagRow>
            <Main>
                {errorQuote && <Left>N/A</Left>}
                {!errorQuote && (
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
            {errorQuote && (
                <ErrorFooter>
                    <IconWrapper>
                        <StyledIcon icon="CROSS" size={12} color={theme.TYPE_RED} />
                    </IconWrapper>
                    <ErrorText>{getQuoteError(quote)}</ErrorText>
                </ErrorFooter>
            )}
        </Wrapper>
    );
};

export default Quote;
