import { BuyProviderInfo } from 'invity-api';

import { Button } from '@trezor/components';

import { saveTransactionDetailId } from 'src/actions/wallet/coinmarketBuyActions';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { TradeBuy } from 'src/types/wallet/coinmarketCommonTypes';
import { useDispatch } from 'src/hooks/suite';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionId';
import { CoinmarketTransactionInfo } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionInfo';
import { CoinmarketTransactionAmounts } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionAmounts';
import { CoinmarketTransactionProvider } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionProvider';
import { CoinmarketTransactionContainer } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransaction/CoinmarketTransactionContainer';

interface CoinmarketTransactionBuyProps {
    trade: TradeBuy;
    account: Account;
    providers?: {
        [name: string]: BuyProviderInfo;
    };
}

export const CoinmarketTransactionBuy = ({
    trade,
    providers,
    account,
}: CoinmarketTransactionBuyProps) => {
    const dispatch = useDispatch();
    const { navigateToBuyDetail } = useCoinmarketNavigation(account);

    const { exchange, paymentMethod, paymentMethodName } = trade.data;

    const handleViewDetailsButtonClick = () => {
        dispatch(saveTransactionDetailId(trade.key || ''));
        navigateToBuyDetail();
    };

    useCoinmarketWatchTrade({
        account,
        trade,
    });

    if (!trade.data.paymentId) return null;

    return (
        <CoinmarketTransactionContainer
            TradeDetail={
                <>
                    <CoinmarketTransactionAmounts trade={trade} />
                    <CoinmarketTransactionInfo trade={trade} />
                    <CoinmarketTransactionId transactionId={trade.data.paymentId} />
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
                <Button size="small" variant="tertiary" onClick={handleViewDetailsButtonClick}>
                    <Translation id="TR_COINMARKET_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
