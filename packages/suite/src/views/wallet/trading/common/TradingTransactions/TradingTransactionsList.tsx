import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import {
    selectDeviceTradingTradesOrderedByDate,
    selectTradingBuyProviders,
    selectTradingExchangeInfo,
    selectTradingSellInfo,
} from '@suite-common/trading';
import { Box, Column, Paragraph, Text } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';
import { TradingTransactionExchange } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionExchange';
import { TradingTransactionBuy } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsBuy';
import { TradingTransactionSell } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsSell';

export const TradingTransactionsList = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const buyProviders = useSelector(selectTradingBuyProviders);
    const exchangeProviders = useSelector(selectTradingExchangeInfo)?.providerInfos;
    const sellProviders = useSelector(selectTradingSellInfo)?.providerInfos;
    const trades = useSelector(selectDeviceTradingTradesOrderedByDate);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;

    const buyTransactions = trades.filter(tx => tx.tradeType === 'buy');
    const exchangeTransactions = trades.filter(tx => tx.tradeType === 'exchange');
    const sellTransactions = trades.filter(tx => tx.tradeType === 'sell');
    const isEmpty = trades.length === 0;

    return (
        <Column alignItems="center">
            <Box data-testid="@trading/transactions/list" maxWidth={800}>
                {isEmpty && (
                    <Paragraph
                        data-testid="@trading/transactions/no-transaction"
                        align="center"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_BUY_NOT_TRANSACTIONS" />
                    </Paragraph>
                )}
                {!isEmpty && (
                    <>
                        <Column margin={{ bottom: 32 }}>
                            <Text
                                typographyStyle="body-sm"
                                color="contentSecondary"
                                data-testid="@trading/transactions/count"
                            >
                                <Translation
                                    id="TR_TRADING_TRADE_HISTORY_COUNTER"
                                    values={{
                                        totalBuys: buyTransactions.length,
                                        totalSells: sellTransactions.length,
                                        totalSwaps: exchangeTransactions.length,
                                    }}
                                />
                            </Text>
                        </Column>
                        {trades.map(trade => {
                            const key = `${trade.tradeType}-${trade.key}`;

                            switch (trade.tradeType) {
                                case 'buy':
                                    return (
                                        <TradingTransactionBuy
                                            account={account}
                                            key={key}
                                            trade={trade}
                                            providers={buyProviders}
                                        />
                                    );
                                case 'sell':
                                    return (
                                        <TradingTransactionSell
                                            account={account}
                                            key={key}
                                            trade={trade}
                                            providers={sellProviders}
                                        />
                                    );
                                case 'exchange':
                                    return (
                                        <TradingTransactionExchange
                                            account={account}
                                            key={key}
                                            trade={trade}
                                            providers={exchangeProviders}
                                        />
                                    );
                                default:
                                    return exhaustive(trade);
                            }
                        })}
                    </>
                )}
            </Box>
        </Column>
    );
};
