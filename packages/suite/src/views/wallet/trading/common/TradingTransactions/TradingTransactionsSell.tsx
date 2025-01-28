import { SellProviderInfo } from 'invity-api';

import { Button } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { saveComposedTransactionInfo } from 'src/actions/wallet/trading/tradingCommonActions';
import {
    saveQuoteRequest,
    saveTransactionId,
    setIsFromRedirect,
} from 'src/actions/wallet/tradingSellActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { Account } from 'src/types/wallet';
import { TradeSell } from 'src/types/wallet/tradingCommonTypes';
import { TradingTransactionId } from 'src/views/wallet/trading/common';
import { TradingTransactionAmounts } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionAmounts';
import { TradingTransactionContainer } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionContainer';
import { TradingTransactionInfo } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionInfo';
import { TradingTransactionProvider } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionProvider';

interface TradingTransactionSellProps {
    trade: TradeSell;
    account: Account;
    providers?: {
        [name: string]: SellProviderInfo;
    };
}

export const TradingTransactionSell = ({
    trade,
    providers,
    account,
}: TradingTransactionSellProps) => {
    const dispatch = useDispatch();
    const { composed, selectedFee } = useSelector(
        state => state.wallet.trading.composedTransactionInfo,
    );

    const {
        amountInCrypto,
        fiatCurrency,
        exchange,
        paymentMethod,
        paymentMethodName,
        cryptoCurrency,
    } = trade.data;

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
                goto('wallet-trading-sell-confirm', {
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
            goto('wallet-trading-sell-detail', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    useTradingWatchTrade({ account, trade });

    if (!trade.data.orderId) return null;

    return (
        <TradingTransactionContainer
            TradeDetail={
                <>
                    <TradingTransactionAmounts trade={trade} />
                    <TradingTransactionInfo trade={trade} />
                    <TradingTransactionId transactionId={trade.data.orderId} />
                </>
            }
            TradeProviders={
                <TradingTransactionProvider
                    exchange={exchange}
                    providers={providers}
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            }
            TradeButton={
                <Button variant="tertiary" onClick={viewDetail}>
                    <Translation id="TR_TRADING_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
