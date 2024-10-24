import { SellProviderInfo } from 'invity-api';
import { goto } from 'src/actions/suite/routerActions';
import { saveComposedTransactionInfo } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    saveQuoteRequest,
    saveTransactionId,
    setIsFromRedirect,
} from 'src/actions/wallet/coinmarketSellActions';
import { Button } from '@trezor/components';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { CoinmarketTransactionAmounts } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionAmounts';
import { CoinmarketTransactionInfo } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionInfo';
import { CoinmarketTransactionProvider } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionProvider';
import { CoinmarketTransactionContainer } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionContainer';

interface CoinmarketTransactionSellProps {
    trade: TradeSell;
    account: Account;
    providers?: {
        [name: string]: SellProviderInfo;
    };
}

export const CoinmarketTransactionSell = ({
    trade,
    providers,
    account,
}: CoinmarketTransactionSellProps) => {
    const dispatch = useDispatch();
    const { composed, selectedFee } = useSelector(
        state => state.wallet.coinmarket.composedTransactionInfo,
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
                goto('wallet-coinmarket-sell-confirm', {
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

    useCoinmarketWatchTrade({ account, trade });

    if (!trade.data.orderId) return null;

    return (
        <CoinmarketTransactionContainer
            TradeDetail={
                <>
                    <CoinmarketTransactionAmounts trade={trade} />
                    <CoinmarketTransactionInfo trade={trade} />
                    <CoinmarketTransactionId transactionId={trade.data.orderId} />
                </>
            }
            TradeProviders={
                <CoinmarketTransactionProvider
                    exchange={exchange}
                    providers={providers}
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            }
            TradeButton={
                <Button variant="tertiary" onClick={viewDetail}>
                    <Translation id="TR_COINMARKET_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
