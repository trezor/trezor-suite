import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import Quote from './Quote';
import { ExchangeTrade } from 'invity-api';
import { FiatValue, FormattedCryptoAmount, QuestionTooltip, Translation } from '@suite-components';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { useSelector } from '@suite-hooks';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';

const Wrapper = styled.div``;
const Quotes = styled.div``;

const StyledQuote = styled(Quote)`
    margin-bottom: 20px;
`;

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding: 10px 0;
`;

const Divider = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    cursor: default;
    padding: 10px 0;
`;

const DividerLine = styled.div`
    height: 1px;
    flex: 1;
    background: ${props => props.theme.STROKE_GREY};
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    justify-self: flex-end;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledQuestionTooltip = styled(QuestionTooltip)`
    padding-left: 4px;
    padding-top: 1px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const RatesRow = styled.div`
    margin: 10px 0;
    display: flex;
    align-items: center;
`;

interface Props {
    quotes?: ExchangeTrade[];
    type: 'float' | 'fixed' | 'dex';
}

const List = ({ quotes, type }: Props) => {
    const {
        quotesRequest,
        account: { symbol },
    } = useCoinmarketExchangeOffersContext();
    const { fee } = useSelector(state => ({
        fee: state.wallet.coinmarket.composedTransactionInfo.composed?.fee,
    }));
    if (!quotesRequest || !quotes) return null;

    return (
        <Wrapper>
            <Divider>
                <DividerLine />
            </Divider>
            <SummaryRow>
                <Left>
                    {type === 'fixed' && (
                        <RatesRow>
                            <Translation id="TR_EXCHANGE_FIXED_OFFERS" />
                            <StyledQuestionTooltip tooltip="TR_EXCHANGE_FIXED_OFFERS_INFO" />
                        </RatesRow>
                    )}{' '}
                    {type === 'float' && (
                        <RatesRow>
                            <Translation id="TR_EXCHANGE_FLOAT_OFFERS" />
                            <StyledQuestionTooltip tooltip="TR_EXCHANGE_FLOAT_OFFERS_INFO" />
                        </RatesRow>
                    )}
                    {type === 'dex' && (
                        <RatesRow>
                            <Translation id="TR_EXCHANGE_DEX_OFFERS" />
                            <StyledQuestionTooltip tooltip="TR_EXCHANGE_DEX_OFFERS_INFO" />
                        </RatesRow>
                    )}
                </Left>
                {type !== 'dex' && (
                    <Right>
                        <Translation
                            id="TR_EXCHANGE_FEES_INFO"
                            values={{
                                feeAmount: (
                                    <FormattedCryptoAmount
                                        disableHiddenPlaceholder
                                        value={formatNetworkAmount(fee || '0', symbol)}
                                        symbol={symbol}
                                    />
                                ),
                                feeAmountFiat: (
                                    <FiatValue
                                        disableHiddenPlaceholder
                                        amount={formatNetworkAmount(fee || '0', symbol)}
                                        symbol={symbol}
                                    />
                                ),
                            }}
                        />
                        <StyledQuestionTooltip tooltip="TR_EXCHANGE_FEES_INCLUDED_INFO" />
                    </Right>
                )}
                {type === 'dex' && (
                    <Right>
                        <Translation id="TR_EXCHANGE_DEX_FEES_INFO" />
                        <StyledQuestionTooltip tooltip="TR_EXCHANGE_DEX_FEES_INFO_TOOLTIP" />
                    </Right>
                )}
            </SummaryRow>
            <Quotes>
                {quotes.map(quote => (
                    <StyledQuote key={`${quote.exchange}`} quote={quote} />
                ))}
            </Quotes>
        </Wrapper>
    );
};

export default List;
