import { useMemo } from 'react';

import styled from 'styled-components';

import {
    selectTradingActiveSection,
    selectTradingBuyProviders,
    selectTradingExchangeInfo,
    selectTradingSellInfo,
    selectTradingTradesForSelectedDevice,
} from '@suite-common/trading';
import { H3, Paragraph, variables } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { TradingTransactionExchange } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionExchange';
import { TradingTransactionBuy } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsBuy';
import { TradingTransactionSell } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransactionsSell';

const Wrapper = styled.div`
    padding: ${spacingsPx.zero} ${spacingsPx.lg};

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        padding: 0;
    }
`;

const Header = styled.div`
    padding-bottom: ${spacingsPx.xxl};
`;

const TransactionCount = styled.div`
    margin-top: ${spacingsPx.xxxs};
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

export const TradingTransactionsList = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const buyProviders = useSelector(selectTradingBuyProviders);
    const exchangeProviders = useSelector(selectTradingExchangeInfo)?.providerInfos;
    const sellProviders = useSelector(selectTradingSellInfo)?.providerInfos;
    const activeSection = useSelector(selectTradingActiveSection);
    const isBuyAndSell = activeSection !== 'exchange';
    const trades = useSelector(selectTradingTradesForSelectedDevice);
    const sortedTrades = useMemo(
        () =>
            [...trades].sort((a, b) => {
                if (a.date > b.date) return -1;
                if (a.date < b.date) return 1;

                return 0;
            }),
        [trades],
    );

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;

    const buyTransactions = sortedTrades.filter(tx => tx.tradeType === 'buy');
    const exchangeTransactions = sortedTrades.filter(tx => tx.tradeType === 'exchange');
    const sellTransactions = sortedTrades.filter(tx => tx.tradeType === 'sell');
    const buyAndSellTransactionLength = buyTransactions.length + sellTransactions.length;
    const isEmpty =
        (isBuyAndSell && buyAndSellTransactionLength === 0) ||
        (!isBuyAndSell && exchangeTransactions.length === 0);

    return (
        <Wrapper data-testid="@trading/transactions/list">
            {isEmpty && (
                <Paragraph
                    data-testid="@trading/transactions/no-transaction"
                    align="center"
                    variant="tertiary"
                >
                    <Translation id="TR_BUY_NOT_TRANSACTIONS" />
                </Paragraph>
            )}
            {!isEmpty && (
                <>
                    <Header>
                        <H3>
                            <Translation id="TR_TRADING_LAST_TRANSACTIONS" />
                        </H3>
                        <TransactionCount data-testid="@trading/transactions/count">
                            {isBuyAndSell ? (
                                <Translation
                                    id="TR_TRADING_BUY_AND_SELL_COUNTER"
                                    values={{
                                        totalBuys: buyTransactions.length,
                                        totalSells: sellTransactions.length,
                                    }}
                                />
                            ) : (
                                <Translation
                                    id="TR_TRADING_SWAP_COUNTER"
                                    values={{
                                        totalSwaps: exchangeTransactions.length,
                                    }}
                                />
                            )}
                        </TransactionCount>
                    </Header>
                    {sortedTrades.map(trade => {
                        if (isBuyAndSell && trade.tradeType === 'buy') {
                            return (
                                <TradingTransactionBuy
                                    account={account}
                                    key={`${trade.tradeType}-${trade.key}`}
                                    trade={trade}
                                    providers={buyProviders}
                                />
                            );
                        }
                        if (isBuyAndSell && trade.tradeType === 'sell') {
                            return (
                                <TradingTransactionSell
                                    account={account}
                                    key={`${trade.tradeType}-${trade.key}`}
                                    trade={trade}
                                    providers={sellProviders}
                                />
                            );
                        }

                        if (!isBuyAndSell && trade.tradeType === 'exchange') {
                            return (
                                <TradingTransactionExchange
                                    account={account}
                                    key={`${trade.tradeType}-${trade.key}`}
                                    trade={trade}
                                    providers={exchangeProviders}
                                />
                            );
                        }
                    })}
                </>
            )}
        </Wrapper>
    );
};
