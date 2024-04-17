import type { BuyTrade } from 'invity-api';

import type { Timer } from '@trezor/react-utils';

import type { AppState } from 'src/types/suite';
import type { Account } from 'src/types/wallet';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { UseCoinmarketFilterReducerOutputProps } from 'src/reducers/wallet/useCoinmarketFilterReducer';

export type UseOffersProps = WithSelectedAccountLoadedProps;

export type ContextValues = {
    account: Account;
    callInProgress: boolean;
    alternativeQuotes: AppState['wallet']['coinmarket']['buy']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
    device: AppState['device']['selectedDevice'];
    selectedQuote?: BuyTrade;
    verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
    addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
    providersInfo?: BuyInfo['providerInfos'];
    selectQuote: (quote: BuyTrade) => void;
    goToPayment: (address: string) => void;
    timer: Timer;
    getQuotes: () => Promise<void>;
    innerQuotesFilterReducer: UseCoinmarketFilterReducerOutputProps;
    innerAlternativeQuotesFilterReducer: UseCoinmarketFilterReducerOutputProps;
};

export type AddressOptionsFormState = {
    address?: string;
};
