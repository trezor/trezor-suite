import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { H2, variables } from '@trezor/components';
import styled from 'styled-components';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketTransactionSell } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionsSell';
import { CoinmarketTransactionBuy } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionsBuy';
import { CoinmarketTransactionExchange } from 'src/views/wallet/coinmarket/common/CoinmarketTransactions/CoinmarketTransactionExchange';

const Wrapper = styled.div`
    margin-bottom: 48px;
    padding: ${spacingsPx.xxl} 0 0;
`;

const Content = styled.div``;
const Header = styled.div`
    align-items: center;
    padding-bottom: 32px;
`;

const NoTransactions = styled.div`
    display: flex;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

const TransactionCount = styled.div`
    margin-top: 6px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

// TODO: refactor and sub components
export const CoinmarketTransactionsList = () => {
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
                <NoTransactions>
                    <Translation id="TR_BUY_NOT_TRANSACTIONS" />
                </NoTransactions>
            )}
            {sortedAccountTransactions.length > 0 && (
                <>
                    <Header>
                        <H2>
                            <Translation id="TR_BUY_ACCOUNT_TRANSACTIONS" />
                        </H2>
                        <p>
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
                        </p>
                    </Header>
                    <Content>
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
                            if (trade.tradeType === 'exchange') {
                                return (
                                    <CoinmarketTransactionExchange
                                        account={account}
                                        key={`${trade.tradeType}-${trade.key}`}
                                        trade={trade}
                                        providers={exchangeProviders}
                                    />
                                );
                            }

                            return null;
                        })}
                    </Content>
                </>
            )}
        </Wrapper>
    );
};
