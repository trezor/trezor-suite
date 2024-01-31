import styled, { useTheme } from 'styled-components';
import { SellProviderInfo } from 'invity-api';

import { useWatchSellTrade } from 'src/hooks/wallet/useCoinmarket';
import { goto } from 'src/actions/suite/routerActions';
import { saveComposedTransactionInfo } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    saveQuoteRequest,
    saveTransactionId,
    setIsFromRedirect,
} from 'src/actions/wallet/coinmarketSellActions';
import { variables, Icon, Button } from '@trezor/components';
import { CoinmarketPaymentType, CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common';
import { Account } from 'src/types/wallet';
import {
    Translation,
    HiddenPlaceholder,
    FormattedDate,
    FormattedCryptoAmount,
} from 'src/components/suite';
import { TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import { useDispatch, useSelector } from 'src/hooks/suite';
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

const SellColumn = styled(Column)`
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

const Arrow = styled.div`
    display: flex;
    align-items: center;
    padding: 0 11px;
`;

interface SellTransactionProps {
    trade: TradeSell;
    account: Account;
    providers?: {
        [name: string]: SellProviderInfo;
    };
}

export const SellTransaction = ({ trade, providers, account }: SellTransactionProps) => {
    const theme = useTheme();
    const { composed, selectedFee } = useSelector(
        state => state.wallet.coinmarket.composedTransactionInfo,
    );
    const dispatch = useDispatch();
    useWatchSellTrade(account, trade);

    const { date, data } = trade;
    const {
        amountInCrypto,
        fiatStringAmount,
        fiatCurrency,
        cryptoStringAmount,
        exchange,
        paymentMethod,
        paymentMethodName,
        cryptoCurrency,
    } = data;

    const viewDetail = () => {
        dispatch(saveTransactionId(trade.key || ''));
        if (trade.data.status === 'SUBMITTED' || trade.data.status === 'SEND_CRYPTO') {
            // continue to the sell flow
            dispatch(
                saveQuoteRequest({
                    amountInCrypto: amountInCrypto || false,
                    fiatCurrency: fiatCurrency || '',
                    cryptoCurrency: cryptoCurrency!,
                }),
            );
            dispatch(setIsFromRedirect(true));
            // use fee selected by user or normal
            dispatch(
                saveComposedTransactionInfo({
                    selectedFee: selectedFee || 'normal',
                    composed: composed || {
                        feePerByte: '',
                        fee: '',
                    },
                }),
            );
            dispatch(
                goto('wallet-coinmarket-sell-offers', {
                    params: {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    },
                }),
            );
            return;
        }
        dispatch(
            goto('wallet-coinmarket-sell-detail', {
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
                    <FormattedCryptoAmount
                        value={cryptoStringAmount}
                        symbol={cryptoToCoinSymbol(cryptoCurrency!)}
                    />
                    <Arrow>
                        <Icon color={theme.TYPE_LIGHT_GREY} size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    <div>
                        <HiddenPlaceholder>
                            {fiatStringAmount} {fiatCurrency}
                        </HiddenPlaceholder>
                    </div>
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
                    <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
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
