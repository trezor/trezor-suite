import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { BankAccount, SellFiatTrade } from 'invity-api';
import { Timer } from '@suite-hooks/useTimeInterval';
import { CoinmarketSellAction, SellInfo } from '@wallet-actions/coinmarketSellActions';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    quotes: AppState['wallet']['coinmarket']['sell']['quotes'];
    alternativeQuotes: AppState['wallet']['coinmarket']['sell']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    sellInfo?: SellInfo;
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export type SellStep = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

export type ContextValues = {
    callInProgress: boolean;
    account: Account;
    quotes: AppState['wallet']['coinmarket']['sell']['quotes'];
    alternativeQuotes: AppState['wallet']['coinmarket']['sell']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    device: AppState['suite']['device'];
    selectedQuote?: SellFiatTrade;
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
