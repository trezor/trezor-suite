import styled, { useTheme } from 'styled-components';
import { ExchangeProviderInfo } from 'invity-api';

import { Button, Icon, variables } from '@trezor/components';
import { CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common';
import { TradeExchange } from 'src/types/wallet/coinmarketCommonTypes';
import { goto } from 'src/actions/suite/routerActions';
import { saveTransactionId } from 'src/actions/wallet/coinmarketExchangeActions';
import { Account } from 'src/types/wallet';
import { Translation, FormattedDate, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketTransactionStatus } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionStatus';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        background: ${({ theme }) => theme.legacy.BG_WHITE};
        border: 1px solid ${({ theme }) => theme.legacy.TYPE_WHITE};
        box-shadow: 0 1px 2px 0 ${({ theme }) => theme.legacy.BOX_SHADOW_BLACK_20};
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
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
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    flex: 0 1 auto;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        border-left: 0;
    }
`;

const ProviderColumn = styled(Column)`
    max-width: 200px;
`;

const TradeID = styled.span`
    padding-left: 5px;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SmallRow = styled.div`
    padding-top: 8px;
    display: flex;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
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

interface CoinmarketTransactionExchangeProps {
    trade: TradeExchange;
    account: Account;
    providers?: {
        [name: string]: ExchangeProviderInfo;
    };
}

export const CoinmarketTransactionExchange = ({
    trade,
    providers,
    account,
}: CoinmarketTransactionExchangeProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const theme = useTheme();
    useCoinmarketWatchTrade({ account, trade });
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();

    const { date, data } = trade;
    const { send, sendStringAmount, receive, receiveStringAmount, exchange } = data;

    const viewDetail = () => {
        dispatch(saveTransactionId(trade.key || ''));
        dispatch(goto('wallet-coinmarket-exchange-detail'));
    };

    if (!send || !receive) return null;

    return (
        <Wrapper>
            <Column>
                <Row>
                    <Amount>
                        <FormattedCryptoAmount
                            value={sendStringAmount}
                            symbol={cryptoIdToCoinSymbol(send)}
                        />
                    </Amount>
                    <Arrow>
                        <Icon color={theme.legacy.TYPE_LIGHT_GREY} size={13} name="caretRight" />
                    </Arrow>
                    <FormattedCryptoAmount
                        value={receiveStringAmount}
                        symbol={cryptoIdToCoinSymbol(receive)}
                    />
                    {/* TODO FIX THIS LOGO */}
                    {/* <StyledCoinLogo size={13} symbol={symbol} /> */}
                </Row>
                <SmallRowStatus>
                    {translationString('TR_COINMARKET_SWAP').toUpperCase()} •{' '}
                    <FormattedDate value={date} date time /> •{' '}
                    <CoinmarketTransactionStatus trade={data} tradeType={trade.tradeType} />
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
                <Button size="small" variant="tertiary" onClick={viewDetail}>
                    <Translation id="TR_EXCHANGE_VIEW_DETAILS" />
                </Button>
            </BuyColumn>
        </Wrapper>
    );
};
