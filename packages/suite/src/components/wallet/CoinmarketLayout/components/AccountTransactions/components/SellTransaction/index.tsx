import React from 'react';
import styled from 'styled-components';
import { SellProviderInfo } from 'invity-api';
import { useWatchSellTrade } from '@wallet-hooks/useCoinmarket';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import { useTheme, variables, Icon, Button } from '@trezor/components';
import { CoinmarketPaymentType, CoinmarketProviderInfo } from '@wallet-components';
import { Account } from '@wallet-types';
import { Translation, HiddenPlaceholder, FormattedDate } from '@suite-components';
import { TradeSell } from '@wallet-types/coinmarketCommonTypes';
import Status from '../Status';
import { useActions } from '@suite-hooks';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';

interface Props {
    trade: TradeSell;
    account: Account;
    providers?: {
        [name: string]: SellProviderInfo;
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
        background: ${props => props.theme.BG_WHITE};
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

const SellColumn = styled(Column)`
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

const SellTransaction = ({ trade, providers, account }: Props) => {
    const theme = useTheme();
    const { goto, saveTransactionDetailId } = useActions({
        goto: routerActions.goto,
        saveTransactionDetailId: coinmarketSellActions.saveTransactionId,
    });
    useWatchSellTrade(account, trade);

    const { date, data } = trade;
    const {
        fiatStringAmount,
        fiatCurrency,
        cryptoStringAmount,
        exchange,
        paymentMethod,
        cryptoCurrency,
    } = data;

    const viewDetail = async () => {
        await saveTransactionDetailId(trade.key || '');
        goto('wallet-coinmarket-sell-detail', {
            params: {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            },
        });
    };

    return (
        <Wrapper>
            <Column>
                <Row>
                    <HiddenPlaceholder>
                        {formatCryptoAmount(Number(cryptoStringAmount))} {cryptoCurrency}
                    </HiddenPlaceholder>
                    <Arrow>
                        <Icon color={theme.TYPE_LIGHT_GREY} size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    <Amount>
                        <HiddenPlaceholder>
                            {fiatStringAmount} {fiatCurrency}
                        </HiddenPlaceholder>
                    </Amount>
                </Row>
                <SmallRowStatus>
                    {trade.tradeType.toUpperCase()} • <FormattedDate value={date} date time /> •{' '}
                    <StyledStatus trade={data} tradeType={trade.tradeType} />
                </SmallRowStatus>
                <SmallRow>
                    <Translation id="TR_SELL_TRANS_ID" />
                    <TradeID>{trade.data.paymentId}</TradeID>
                </SmallRow>
            </Column>
            <ProviderColumn>
                <Row>
                    <CoinmarketProviderInfo exchange={exchange} providers={providers} />
                </Row>
                <RowSecond>
                    <CoinmarketPaymentType method={paymentMethod} />
                </RowSecond>
            </ProviderColumn>
            <SellColumn>
                <Button variant="tertiary" onClick={viewDetail}>
                    <Translation id="TR_SELL_VIEW_DETAILS" />
                </Button>
            </SellColumn>
        </Wrapper>
    );
};

export default SellTransaction;
