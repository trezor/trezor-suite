import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { ExchangeTrade } from 'invity-api';
import { Timer } from '@suite-hooks/useTimeInterval';
import { CoinmarketExchangeAction, ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    fixedQuotes: AppState['wallet']['coinmarket']['exchange']['fixedQuotes'];
    floatQuotes: AppState['wallet']['coinmarket']['exchange']['floatQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    addressVerified: AppState['wallet']['coinmarket']['exchange']['addressVerified'];
    exchangeInfo?: ExchangeInfo;
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export type ExchangeStep = 'RECEIVING_ADDRESS' | 'SEND_TRANSACTION';

export type ContextValues = {
    callInProgress: boolean;
    account: Account;
    fixedQuotes: AppState['wallet']['coinmarket']['exchange']['fixedQuotes'];
    floatQuotes: AppState['wallet']['coinmarket']['exchange']['floatQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    device: AppState['suite']['device'];
    selectedQuote?: ExchangeTrade;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    addressVerified: AppState['wallet']['coinmarket']['exchange']['addressVerified'];
    exchangeInfo?: ExchangeInfo;
    exchangeStep: ExchangeStep;
    setExchangeStep: (step: ExchangeStep) => void;
    selectQuote: (quote: ExchangeTrade) => void;
    verifyAddress: (account: Account, inExchange: boolean) => Promise<void>;
    receiveSymbol?: string;
    receiveAccount?: Account;
    setReceiveAccount: (account?: Account) => void;
    saveTrade: (
        exchangeTrade: ExchangeTrade,
        account: Account,
        date: string,
    ) => CoinmarketExchangeAction;
    confirmTrade: (address: string, extraField?: string) => void;
    sendTransaction: () => void;
    timer: Timer;
    getQuotes: () => Promise<void>;
};
