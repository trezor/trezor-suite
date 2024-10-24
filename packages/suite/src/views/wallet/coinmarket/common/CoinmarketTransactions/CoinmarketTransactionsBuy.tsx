import { useState } from 'react';
import { BuyProviderInfo, BuyTradeQuoteRequest } from 'invity-api';

import invityAPI from 'src/services/suite/invityAPI';
import {
    clearQuotes,
    saveCachedAccountInfo,
    saveQuoteRequest,
    saveQuotes,
    saveTransactionDetailId,
} from 'src/actions/wallet/coinmarketBuyActions';
import { Button } from '@trezor/components';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { getStatusMessage } from 'src/utils/wallet/coinmarket/buyUtils';
import { TradeBuy } from 'src/types/wallet/coinmarketCommonTypes';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import {
    addIdsToQuotes,
    filterQuotesAccordingTags,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
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
    const [isGettingOffers, setIsGettingOffers] = useState(false);
    const dispatch = useDispatch();
    const { navigateToBuyOffers, navigateToBuyDetail } = useCoinmarketNavigation(account);
    const country = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.buyInfo?.country);

    const {
        fiatStringAmount,
        fiatCurrency,
        status,
        exchange,
        paymentMethod,
        paymentMethodName,
        receiveCurrency,
    } = trade.data;

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
            const quotes = filterQuotesAccordingTags<CoinmarketTradeBuyType>(
                addIdsToQuotes<CoinmarketTradeBuyType>(allQuotes, 'buy'),
            );

            dispatch(saveQuotes(quotes));
        } else {
            dispatch(clearQuotes());
        }

        navigateToBuyOffers();
    };

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
                <>
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
                        <Button
                            size="small"
                            variant="tertiary"
                            onClick={handleViewDetailsButtonClick}
                        >
                            <Translation id="TR_COINMARKET_VIEW_DETAILS" />
                        </Button>
                    )}
                </>
            }
        />
    );
};
