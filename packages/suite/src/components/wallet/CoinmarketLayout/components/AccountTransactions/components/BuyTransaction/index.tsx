import React, { useState } from 'react';
import styled from 'styled-components';
import { BuyProviderInfo, BuyTradeQuoteRequest } from 'invity-api';
import invityAPI from '@suite-services/invityAPI';
import { useWatchBuyTrade } from '@wallet-hooks/useCoinmarket';
import { FormattedDate } from 'react-intl';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { useTheme, variables, Icon, Button } from '@trezor/components';
import { CoinmarketPaymentType, CoinmarketBuyProviderInfo } from '@wallet-components';
import { Account } from '@wallet-types';
import { Translation, HiddenPlaceholder } from '@suite-components';
import { getStatusMessage, processQuotes } from '@wallet-utils/coinmarket/buyUtils';
import { TradeBuy } from '@wallet-reducers/coinmarketReducer';
import Status from '../Status';
import { useSelector, useActions } from '@suite-hooks';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';

interface Props {
    trade: TradeBuy;
    account: Account;
    providers?: {
        [name: string]: BuyProviderInfo;
    };
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        color: ${props => props.theme.BG_WHITE};
        border: 1px solid ${props => props.theme.TYPE_WHITE};
        box-shadow: 0 1px 2px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
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

    border-left: 1px solid ${props => props.theme.STROKE_GREY};
`;

const ProviderColumn = styled(Column)`
    max-width: 200px;
`;

const TradeID = styled.span`
    padding-left: 5px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const RowSecond = styled(Row)`
    padding-top: 8px;
    display: flex;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        justify-content: center;
    }
`;

const SmallRow = styled.div`
    padding-top: 8px;
    display: flex;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
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

const BuyTransaction = ({ trade, providers, account }: Props) => {
    const theme = useTheme();
    const { goto } = useActions({ goto: routerActions.goto });
    const {
        saveTransactionDetailId,
        saveQuotes,
        saveQuoteRequest,
        saveCachedAccountInfo,
    } = useActions({
        saveTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
        saveQuotes: coinmarketBuyActions.saveQuotes,
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveCachedAccountInfo: coinmarketBuyActions.saveCachedAccountInfo,
    });
    const country = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.buyInfo?.country);
    const [isGettingOffers, setIsGettingOffers] = useState(false);
    useWatchBuyTrade(account, trade);

    const { date, data } = trade;
    const {
        fiatStringAmount,
        fiatCurrency,
        status,
        receiveStringAmount,
        exchange,
        paymentMethod,
        receiveCurrency,
    } = data;

    const statusMessage = getStatusMessage(status || 'SUBMITTED');

    const getOffers = async () => {
        setIsGettingOffers(true);
        const request: BuyTradeQuoteRequest = {
            fiatCurrency: data.fiatCurrency || '',
            receiveCurrency: data.receiveCurrency || '',
            fiatStringAmount: data.fiatStringAmount || '',
            wantCrypto: false,
            country,
        };
        await saveQuoteRequest(request);
        await saveCachedAccountInfo(account.symbol, account.index, account.accountType);
        const allQuotes = await invityAPI.getBuyQuotes(request);
        const [quotes, alternativeQuotes] = processQuotes(allQuotes);
        await saveQuotes(quotes, alternativeQuotes);
        goto('wallet-coinmarket-buy-offers', {
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
        });
    };

    const viewDetail = async () => {
        await saveTransactionDetailId(trade.key || '');
        goto('wallet-coinmarket-buy-detail', {
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
                        <HiddenPlaceholder>
                            {fiatStringAmount} {fiatCurrency}
                        </HiddenPlaceholder>
                    </Amount>
                    <Arrow>
                        <Icon color={theme.TYPE_LIGHT_GREY} size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    <HiddenPlaceholder>
                        {formatCryptoAmount(Number(receiveStringAmount))} {receiveCurrency}
                    </HiddenPlaceholder>
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
                    <Translation id="TR_BUY_TRANS_ID" />
                    <TradeID>{trade.data.paymentId}</TradeID>
                </SmallRow>
            </Column>
            <ProviderColumn>
                <Row>
                    <CoinmarketBuyProviderInfo exchange={exchange} providers={providers} />
                </Row>
                <RowSecond>
                    <CoinmarketPaymentType method={paymentMethod} />
                </RowSecond>
            </ProviderColumn>
            <BuyColumn>
                {statusMessage === 'TR_BUY_STATUS_SUCCESS' ? (
                    <Button
                        variant="tertiary"
                        onClick={getOffers}
                        isLoading={isGettingOffers}
                        isDisabled={isGettingOffers}
                    >
                        <Translation id="TR_BUY_BUY_AGAIN" />
                    </Button>
                ) : (
                    <Button variant="tertiary" onClick={viewDetail}>
                        <Translation id="TR_BUY_VIEW_DETAILS" />
                    </Button>
                )}
            </BuyColumn>
        </Wrapper>
    );
};

export default BuyTransaction;
