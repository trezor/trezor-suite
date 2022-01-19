import type { AppState } from '@suite-types';
import type { Account } from '@wallet-types';
import type { BuyTrade } from 'invity-api';
import type { Timer } from '@suite-hooks/useTimeInterval';
import type { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseOffersProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    callInProgress: boolean;
    alternativeQuotes: AppState['wallet']['coinmarket']['buy']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
    device: AppState['suite']['device'];
    selectedQuote?: BuyTrade;
    verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
    addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
    providersInfo?: BuyInfo['providerInfos'];
    selectQuote: (quote: BuyTrade) => void;
    goToPayment: (address: string) => void;
    timer: Timer;
    getQuotes: () => Promise<void>;
};
