import { ExchangeProviderInfo } from 'invity-api';

import { Button } from '@trezor/components';
import { TradeExchange } from 'src/types/wallet/coinmarketCommonTypes';
import { goto } from 'src/actions/suite/routerActions';
import { saveTransactionId } from 'src/actions/wallet/coinmarketExchangeActions';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { CoinmarketTransactionAmounts } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionAmounts';
import { CoinmarketTransactionInfo } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionInfo';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionId';
import { CoinmarketTransactionProvider } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionProvider';
import { CoinmarketTransactionContainer } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionContainer';

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

    const viewDetail = () => {
        dispatch(saveTransactionId(trade.key || ''));
        dispatch(goto('wallet-coinmarket-exchange-detail'));
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
                    exchange={trade.data.exchange}
                    providers={providers}
                />
            }
            TradeButton={
                <Button size="small" variant="tertiary" onClick={viewDetail}>
                    <Translation id="TR_COINMARKET_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
