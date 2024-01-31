import styled, { useTheme } from 'styled-components';
import { ExchangeProviderInfo } from 'invity-api';

import { Button, Icon, variables } from '@trezor/components';
import { CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common';
import { TradeExchange } from 'src/types/wallet/coinmarketCommonTypes';
import { goto } from 'src/actions/suite/routerActions';
import { saveTransactionId } from 'src/actions/wallet/coinmarketExchangeActions';
import { Account } from 'src/types/wallet';
import { useWatchExchangeTrade } from 'src/hooks/wallet/useCoinmarket';
import { Translation, FormattedDate, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { CoinmarketTransactionStatus } from './CoinmarketTransactionStatus';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        background: ${({ theme }) => theme.BG_WHITE};
        border: 1px solid ${({ theme }) => theme.TYPE_WHITE};
        box-shadow: 0 1px 2px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const StyledStatus = styled(CoinmarketTransactionStatus)`
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

    border-left: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const ProviderColumn = styled(Column)`
    max-width: 200px;
`;

const TradeID = styled.span`
    padding-left: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SmallRow = styled.div`
    padding-top: 8px;
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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

interface ExchangeTransactionProps {
    trade: TradeExchange;
    account: Account;
    providers?: {
        [name: string]: ExchangeProviderInfo;
    };
}

export const ExchangeTransaction = ({ trade, providers, account }: ExchangeTransactionProps) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    useWatchExchangeTrade(account, trade);

    const { date, data } = trade;
    const { send, sendStringAmount, receive, receiveStringAmount, exchange } = data;

    const viewDetail = async () => {
        await dispatch(saveTransactionId(trade.key || ''));
        dispatch(
            goto('wallet-coinmarket-exchange-detail', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    return (
        <Wrapper>
            <Column>
                <Row>
                    <Amount>
                        <FormattedCryptoAmount value={sendStringAmount} symbol={send} />
                    </Amount>
                    <Arrow>
                        <Icon color={theme.TYPE_LIGHT_GREY} size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    <FormattedCryptoAmount
                        value={receiveStringAmount}
                        symbol={cryptoToCoinSymbol(receive!)}
                    />
                    {/* TODO FIX THIS LOGO */}
                    {/* <StyledCoinLogo size={13} symbol={symbol} /> */}
                </Row>
                <SmallRowStatus>
                    {trade.tradeType.toUpperCase()} • <FormattedDate value={date} date time /> •{' '}
                    <StyledStatus trade={data} tradeType={trade.tradeType} />
                </SmallRowStatus>
                <SmallRow>
                    <Translation id="TR_EXCHANGE_TRANS_ID" />
                    <TradeID>{trade.data.orderId}</TradeID>
                </SmallRow>
            </Column>
            <ProviderColumn>
                <Row>
                    <CoinmarketProviderInfo exchange={exchange} providers={providers} />
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
