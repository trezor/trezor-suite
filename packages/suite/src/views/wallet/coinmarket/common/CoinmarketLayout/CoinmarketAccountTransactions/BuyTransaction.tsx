import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { BuyProviderInfo, BuyTradeQuoteRequest } from 'invity-api';

import invityAPI from 'src/services/suite/invityAPI';
import { useWatchBuyTrade } from 'src/hooks/wallet/useCoinmarket';
import {
    clearQuotes,
    saveCachedAccountInfo,
    saveQuoteRequest,
    saveQuotes,
    saveTransactionDetailId,
} from 'src/actions/wallet/coinmarketBuyActions';
import { variables, Icon, Button } from '@trezor/components';
import { CoinmarketPaymentType, CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common';
import { Account } from 'src/types/wallet';
import {
    Translation,
    HiddenPlaceholder,
    FormattedDate,
    FormattedCryptoAmount,
} from 'src/components/suite';
import { getStatusMessage, processQuotes } from 'src/utils/wallet/coinmarket/buyUtils';
import { TradeBuy } from 'src/types/wallet/coinmarketCommonTypes';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
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
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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

interface BuyTransactionProps {
    trade: TradeBuy;
    account: Account;
    providers?: {
        [name: string]: BuyProviderInfo;
    };
}

export const BuyTransaction = ({ trade, providers, account }: BuyTransactionProps) => {
    const [isGettingOffers, setIsGettingOffers] = useState(false);
    const dispatch = useDispatch();
    const theme = useTheme();
    const { navigateToBuyOffers, navigateToBuyDetail } = useCoinmarketNavigation(account);
    const country = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.buyInfo?.country);
    useWatchBuyTrade(account, trade);

    const { date, data } = trade;
    const {
        fiatStringAmount,
        fiatCurrency,
        status,
        receiveStringAmount,
        exchange,
        paymentMethod,
        paymentMethodName,
        receiveCurrency,
    } = data;

    const statusMessage = getStatusMessage(status || 'SUBMITTED');

    const getOffers = async () => {
        setIsGettingOffers(true);
        const request: BuyTradeQuoteRequest = {
            fiatCurrency: fiatCurrency || '',
            receiveCurrency: receiveCurrency!,
            fiatStringAmount: fiatStringAmount || '',
            wantCrypto: false,
            country,
        };
        dispatch(saveQuoteRequest(request));
        dispatch(saveCachedAccountInfo(account.symbol, account.index, account.accountType));
        const allQuotes = await invityAPI.getBuyQuotes(request);
        if (allQuotes) {
            const [quotes, alternativeQuotes] = processQuotes(allQuotes);
            dispatch(saveQuotes(quotes, alternativeQuotes));
        } else {
            dispatch(clearQuotes());
        }
        navigateToBuyOffers();
    };

    const handleViewDetailsButtonClick = () => {
        dispatch(saveTransactionDetailId(trade.key || ''));
        navigateToBuyDetail();
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
                    <FormattedCryptoAmount
                        value={receiveStringAmount}
                        symbol={cryptoToCoinSymbol(receiveCurrency!)}
                    />
                    {/* TODO FIX THIS LOGO */}
                    {/* <StyledCoinLogo size={13} symbol={symbol} /> */}
                </Row>
                <SmallRowStatus>
                    {trade.tradeType.toUpperCase()} • <FormattedDate value={date} date time /> •{' '}
                    <StyledStatus trade={data} tradeType={trade.tradeType} />
                </SmallRowStatus>
                <SmallRow>
                    <Translation id="TR_BUY_TRANS_ID" />
                    <TradeID>{trade.data.paymentId}</TradeID>
                </SmallRow>
            </Column>
            <ProviderColumn>
                <Row>
                    <CoinmarketProviderInfo exchange={exchange} providers={providers} />
                </Row>
                <RowSecond>
                    <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
                </RowSecond>
            </ProviderColumn>
            <BuyColumn>
                {statusMessage === 'TR_BUY_STATUS_SUCCESS' ? (
                    <Button
                        size="small"
                        variant="tertiary"
                        onClick={getOffers}
                        isLoading={isGettingOffers}
                        isDisabled={isGettingOffers}
                    >
                        <Translation id="TR_BUY_BUY_AGAIN" />
                    </Button>
                ) : (
                    <Button size="small" variant="tertiary" onClick={handleViewDetailsButtonClick}>
                        <Translation id="TR_BUY_VIEW_DETAILS" />
                    </Button>
                )}
            </BuyColumn>
        </Wrapper>
    );
};
