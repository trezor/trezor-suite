import { SellVoucherTrade as SpendTrade } from 'invity-api';
import { COINMARKET_COMMON } from './constants';
import { Account } from 'src/types/wallet';

export type CoinMarketSpendAction = {
    type: typeof COINMARKET_COMMON.SAVE_TRADE;
    date: string;
    key?: string;
    tradeType: 'spend';
    data: SpendTrade;
    account: {
        symbol: Account['symbol'];
        descriptor: Account['descriptor'];
        accountIndex: Account['index'];
        accountType: Account['accountType'];
    };
};

export const saveTrade = (
    spendTrade: SpendTrade,
    account: Account,
    date: string,
): CoinMarketSpendAction => ({
    type: COINMARKET_COMMON.SAVE_TRADE,
    tradeType: 'spend',
    key: spendTrade.paymentId,
    date,
    data: spendTrade,
    account: {
        descriptor: account.descriptor,
        symbol: account.symbol,
        accountType: account.accountType,
        accountIndex: account.index,
    },
});
