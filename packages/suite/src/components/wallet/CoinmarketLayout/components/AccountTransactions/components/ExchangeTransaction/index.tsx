import React from 'react';
import { FormattedDate } from 'react-intl';
import styled from 'styled-components';
import { ExchangeProviderInfo } from 'invity-api';
import { Button, colors, Icon, variables } from '@trezor/components';
import { CoinmarketExchangeProviderInfo } from '@wallet-components';
import { TradeExchange } from '@wallet-reducers/coinmarketReducer';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import { Account } from '@wallet-types';
import { useWatchExchangeTrade } from '@wallet-hooks/useCoinmarket';
import Status from '../Status';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';

interface Props {
    trade: TradeExchange;
    account: Account;
    providers?: {
        [name: string]: ExchangeProviderInfo;
    };
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        background: ${colors.WHITE};
        border: 1px solid ${colors.WHITE};
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const StyledStatus = styled(Status)`
    margin-left: 5px;
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 17px 24px;
    overflow: hidden;
`;

const BuyColumn = styled(Column)`
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    max-width: 130px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        border-left: 0;
    }

    border-left: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const ProviderColumn = styled(Column)`
    max-width: 200px;
`;

const TradeID = styled.span`
    padding-left: 5px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SmallRow = styled.div`
    padding-top: 8px;
    display: flex;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
    white-space: nowrap;
`;

const SmallRowStatus = styled(SmallRow)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Amount = styled.div``;

const Arrow = styled.div`
    display: flex;
    align-items: center;
    padding: 0 11px;
`;

const ExchangeTransaction = ({ trade, providers, account }: Props) => {
    const { goto, saveTransactionId } = useActions({
        goto: routerActions.goto,
        saveTransactionId: coinmarketExchangeActions.saveTransactionId,
    });
    useWatchExchangeTrade(account, trade);

    const { date, data } = trade;
    const { send, sendStringAmount, receive, receiveStringAmount, exchange } = data;

    const viewDetail = async () => {
        await saveTransactionId(trade.key || '');
        goto('wallet-coinmarket-exchange-detail', {
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
        });
    };

    return (
        <Wrapper>
            <Column>
                <Row>
                    <Amount>
                        {formatCryptoAmount(Number(sendStringAmount))} {send}
                    </Amount>
                    <Arrow>
                        <Icon color={colors.NEUE_TYPE_LIGHT_GREY} size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    {formatCryptoAmount(Number(receiveStringAmount))} {receive}
                    {/* TODO FIX THIS LOGO */}
                    {/* <StyledCoinLogo size={13} symbol={symbol} /> */}
                </Row>
                <SmallRowStatus>
                    {trade.tradeType.toUpperCase()} •{' '}
                    <FormattedDate
                        value={date}
                        year="numeric"
                        month="2-digit"
                        day="2-digit"
                        hour="2-digit"
                        minute="2-digit"
                    />{' '}
                    • <StyledStatus trade={data} tradeType={trade.tradeType} />
                </SmallRowStatus>
                <SmallRow>
                    <Translation id="TR_EXCHANGE_TRANS_ID" />
                    <TradeID>{trade.data.orderId}</TradeID>
                </SmallRow>
            </Column>
            <ProviderColumn>
                <Row>
                    <CoinmarketExchangeProviderInfo exchange={exchange} providers={providers} />
                </Row>
            </ProviderColumn>
            <BuyColumn>
                <Button variant="tertiary" onClick={viewDetail}>
                    <Translation id="TR_EXCHANGE_VIEW_DETAILS" />
                </Button>
            </BuyColumn>
        </Wrapper>
    );
};

export default ExchangeTransaction;
