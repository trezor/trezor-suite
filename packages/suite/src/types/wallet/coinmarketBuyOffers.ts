import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { BuyTrade } from 'invity-api';
import { Timer } from '@suite-hooks/useTimeInterval';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    alternativeQuotes: AppState['wallet']['coinmarket']['buy']['alternativeQuotes'];
    isFromRedirect: AppState['wallet']['coinmarket']['buy']['isFromRedirect'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
    quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
    providersInfo?: BuyInfo['providerInfos'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export type ContextValues = {
    account: Account;
    callInProgress: boolean;
    alternativeQuotes: AppState['wallet']['coinmarket']['buy']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
    device: AppState['suite']['device'];
    selectedQuote?: BuyTrade;
    verifyAddress: (account: Account) => Promise<void>;
    addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
    providersInfo?: BuyInfo['providerInfos'];
    selectQuote: (quote: BuyTrade) => void;
    goToPayment: (address: string) => void;
    timer: Timer;
    getQuotes: () => Promise<void>;
};
