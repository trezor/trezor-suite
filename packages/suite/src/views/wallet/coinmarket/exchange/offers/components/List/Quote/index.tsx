import React from 'react';
import styled from 'styled-components';
import { colors, Button, variables, Icon } from '@trezor/components';
import { QuestionTooltip, Translation } from '@suite-components';
import { ExchangeTrade } from 'invity-api';
import CoinmarketExchangeProviderInfo from '@suite/components/wallet/CoinmarketExchangeProviderInfo';
import { useSelector } from '@suite/hooks/suite';
import { formatCryptoAmount } from '@suite/utils/wallet/coinmarket/exchangeUtils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    flex: 1;
    width: 100%;
    min-height: 150px;
    background: ${colors.WHITE};
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
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-bottom: 9px;
`;

const StyledButton = styled(Button)`
    width: 180px;
`;

const Value = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ErrorFooter = styled.div`
    display: flex;
    margin: 0 30px;
    padding: 10px 0;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
    color: ${colors.RED_ERROR};
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
    padding-top: 1px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

interface Props {
    className?: string;
    selectQuote: (quote: ExchangeTrade) => void;
    quote: ExchangeTrade;
}

const Quote = ({ className, selectQuote, quote }: Props) => {
    const hasTag = false; // TODO - tags are in quote.tags, will need some algorithm to evaluate them and show only one
    const { exchange, error, receive, receiveStringAmount } = quote;
    const providers = useSelector(
        state => state.wallet.coinmarket.exchange.exchangeInfo?.providerInfos,
    );
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <Wrapper className={className}>
            <TagRow>{hasTag && <Tag>best offer</Tag>}</TagRow>
            <Main>
                {error && <Left>N/A</Left>}
                {!error && (
                    <Left>{`${formatCryptoAmount(Number(receiveStringAmount))} ${receive}`}</Left>
                )}
                <Right>
                    <StyledButton isDisabled={!!quote.error} onClick={() => selectQuote(quote)}>
                        <Translation id="TR_EXCHANGE_GET_THIS_OFFER" />
                    </StyledButton>
                </Right>
            </Main>
            <Details>
                <Column>
                    <Heading>
                        <Translation id="TR_EXCHANGE_PROVIDER" />
                    </Heading>
                    <Value>
                        <CoinmarketExchangeProviderInfo exchange={exchange} />
                    </Value>
                </Column>
                <Column>
                    <Heading>
                        <Translation id="TR_EXCHANGE_KYC" />
                        <StyledQuestionTooltip messageId="TR_EXCHANGE_KYC_INFO" />
                    </Heading>
                    <Value>{provider?.kycPolicy}</Value>
                </Column>
            </Details>
            {error && (
                <ErrorFooter>
                    <IconWrapper>
                        <StyledIcon icon="CROSS" size={12} color={colors.RED_ERROR} />
                    </IconWrapper>
                    <ErrorText>{error}</ErrorText>
                </ErrorFooter>
            )}
        </Wrapper>
    );
};

export default Quote;
