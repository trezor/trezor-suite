import type { AppState } from '@suite-types';
import type { Account } from '@wallet-types';
import type { BankAccount, SellFiatTrade } from 'invity-api';
import type { Timer } from '@suite-hooks/useTimeInterval';
import type { CoinmarketSellAction, SellInfo } from '@wallet-actions/coinmarketSellActions';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import { TradeSell } from './coinmarketCommonTypes';

export type UseOffersProps = WithSelectedAccountLoadedProps;

export type SellStep = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

export type ContextValues = {
    callInProgress: boolean;
    account: Account;
    quotes: AppState['wallet']['coinmarket']['sell']['quotes'];
    alternativeQuotes: AppState['wallet']['coinmarket']['sell']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    device: AppState['suite']['device'];
    selectedQuote?: SellFiatTrade;
    trade?: TradeSell;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    sellInfo?: SellInfo;
    sellStep: SellStep;
    setSellStep: (step: SellStep) => void;
    selectQuote: (quote: SellFiatTrade) => void;
    saveTrade: (sellTrade: SellFiatTrade, account: Account, date: string) => CoinmarketSellAction;
    addBankAccount: () => void;
    confirmTrade: (bankAccount: BankAccount) => void;
    sendTransaction: () => void;
    timer: Timer;
    needToRegisterOrVerifyBankAccount: (quote: SellFiatTrade) => boolean;
    getQuotes: () => Promise<void>;
};
