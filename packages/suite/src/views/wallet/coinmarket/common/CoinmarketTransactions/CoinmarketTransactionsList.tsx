import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { H2, Paragraph, variables } from '@trezor/components';
import styled, { useTheme } from 'styled-components';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';
import { spacingsPx, typography } from '@trezor/theme';
import { CoinmarketTransactionSell } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionsSell';
import { CoinmarketTransactionBuy } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionsBuy';
import { CoinmarketTransactionExchange } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionExchange';

const Wrapper = styled.div`
    padding: ${spacingsPx.xl} ${spacingsPx.lg};

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        padding: 0;
    }
`;

const Header = styled.div`
    padding-bottom: ${spacingsPx.xxl};
`;

const TransactionCount = styled.div`
    margin-top: ${spacingsPx.xxs};
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

export const CoinmarketTransactionsList = () => {
    const theme = useTheme();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const allTransactions = useSelector(state => state.wallet.coinmarket.trades);
    const buyProviders = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.providerInfos);
    const exchangeProviders = useSelector(
        state => state.wallet.coinmarket.exchange.exchangeInfo?.providerInfos,
    );
    const sellProviders = useSelector(
        state => state.wallet.coinmarket.sell.sellInfo?.providerInfos,
    );

    useCoinmarketLoadData();

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;
    const sortedAccountTransactions = [...allTransactions]
        .filter(t => t.account.descriptor === account.descriptor)
        .sort((a, b) => {
            if (a.date > b.date) return -1;
            if (a.date < b.date) return 1;

            return 0;
        });

    const buyTransactions = sortedAccountTransactions.filter(tx => tx.tradeType === 'buy');
    const exchangeTransactions = sortedAccountTransactions.filter(
        tx => tx.tradeType === 'exchange',
    );
    const sellTransactions = sortedAccountTransactions.filter(tx => tx.tradeType === 'sell');

    return (
        <Wrapper>
            {sortedAccountTransactions.length === 0 && (
                <Paragraph align="center" color={theme.textSubdued}>
                    <Translation id="TR_BUY_NOT_TRANSACTIONS" />
                </Paragraph>
            )}
            {sortedAccountTransactions.length > 0 && (
                <>
                    <Header>
                        <H2>
                            <Translation id="TR_BUY_ACCOUNT_TRANSACTIONS" />
                        </H2>
                        <TransactionCount>
                            <Translation
                                id="TR_COINMARKET_TRANSACTION_COUNTER"
                                values={{
                                    totalBuys: buyTransactions.length,
                                    totalSells: sellTransactions.length,
                                    totalSwaps: exchangeTransactions.length,
                                }}
                            />
                        </TransactionCount>
                    </Header>
                    {sortedAccountTransactions.map(trade => {
                        if (trade.tradeType === 'buy') {
                            return (
                                <CoinmarketTransactionBuy
                                    account={account}
                                    key={`${trade.tradeType}-${trade.key}`}
                                    trade={trade}
                                    providers={buyProviders}
                                />
                            );
                        }
                        if (trade.tradeType === 'sell') {
                            return (
                                <CoinmarketTransactionSell
                                    account={account}
                                    key={`${trade.tradeType}-${trade.key}`}
                                    trade={trade}
                                    providers={sellProviders}
                                />
                            );
                        }

                        return (
                            <CoinmarketTransactionExchange
                                account={account}
                                key={`${trade.tradeType}-${trade.key}`}
                                trade={trade}
                                providers={exchangeProviders}
                            />
                        );
                    })}
                </>
            )}
        </Wrapper>
    );
};
