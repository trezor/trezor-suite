import { Account } from '@suite-common/wallet-types';
import { AppState } from '../suite';
import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import {
    BankAccount,
    BuyTrade,
    ExchangeTrade,
    P2pProviderInfo,
    P2pQuote,
    P2pQuotesRequest,
    SellFiatTrade,
} from 'invity-api';
import { Timer } from '@trezor/react-utils';
import { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import { UseCoinmarketFilterReducerOutputProps } from 'src/reducers/wallet/useCoinmarketFilterReducer';
import { TradeSell } from '../wallet/coinmarketCommonTypes';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { CoinmarketTradeType } from './coinmarket';

type CoinmarketOffersContextProps = {
    type: CoinmarketTradeType;
    device: AppState['device']['selectedDevice'];
    account: Account;
    callInProgress: boolean;
    timer: Timer;
    getQuotes: () => Promise<void>;
};

type CoinmarketBuyOffersContextProps = CoinmarketOffersContextProps & {
    alternativeQuotes: AppState['wallet']['coinmarket']['buy']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
    selectedQuote?: BuyTrade;
    verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
    addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
    providersInfo?: BuyInfo['providerInfos'];
    selectQuote: (quote: BuyTrade) => void;
    goToPayment: (address: string) => void;
    innerQuotesFilterReducer: UseCoinmarketFilterReducerOutputProps;
};

export type CoinmarketBuyAddressOptionsType = {
    address?: string;
};

export type CoinmarketSellStepType = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

type CoinmarketSellOffersContextProps = CoinmarketOffersContextProps & {
    quotes: AppState['wallet']['coinmarket']['sell']['quotes'];
    alternativeQuotes: AppState['wallet']['coinmarket']['sell']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    selectedQuote?: SellFiatTrade;
    trade?: TradeSell;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    sellInfo?: SellInfo;
    sellStep: CoinmarketSellStepType;
    setSellStep: (step: CoinmarketSellStepType) => void;
    selectQuote: (quote: SellFiatTrade) => void;
    addBankAccount: () => void;
    confirmTrade: (bankAccount: BankAccount) => void;
    sendTransaction: () => void;
    needToRegisterOrVerifyBankAccount: (quote: SellFiatTrade) => boolean;
};

export type CoinmarketExchangeStepType =
    | 'RECEIVING_ADDRESS'
    | 'SEND_TRANSACTION'
    | 'SEND_APPROVAL_TRANSACTION';

type CoinmarketExchangeOffersContextProps = CoinmarketOffersContextProps & {
    fixedQuotes: AppState['wallet']['coinmarket']['exchange']['fixedQuotes'];
    floatQuotes: AppState['wallet']['coinmarket']['exchange']['floatQuotes'];
    dexQuotes: AppState['wallet']['coinmarket']['exchange']['dexQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    selectedQuote?: ExchangeTrade;
    setSelectedQuote: (quote?: ExchangeTrade) => void;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    addressVerified: AppState['wallet']['coinmarket']['exchange']['addressVerified'];
    exchangeInfo?: ExchangeInfo;
    exchangeStep: CoinmarketExchangeStepType;
    setExchangeStep: (step: CoinmarketExchangeStepType) => void;
    selectQuote: (quote: ExchangeTrade) => void;
    verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
    receiveSymbol?: string;
    receiveAccount?: Account;
    setReceiveAccount: (account?: Account) => void;
    confirmTrade: (address: string, extraField?: string) => Promise<boolean>;
    sendTransaction: () => void;
};

export enum P2pStep {
    GET_STARTED,
    RECEIVING_ADDRESS,
}

export type CoinmarketP2pOffersContextProps = Omit<
    CoinmarketOffersContextProps,
    'getQuotes' | 'type'
> & {
    providers?: { [name: string]: P2pProviderInfo };
    quotesRequest?: P2pQuotesRequest;
    quotes?: P2pQuote[];
    selectQuote: (quote: P2pQuote) => void;
    selectedQuote?: P2pQuote;
    p2pStep: P2pStep;
    goToProvider: () => void;
    providerVisited: boolean;
    goToReceivingAddress: () => void;
};

export type CoinmarketOffersMapProps = {
    buy: CoinmarketBuyOffersContextProps;
    sell: CoinmarketSellOffersContextProps;
    exchange: CoinmarketExchangeOffersContextProps;
};

export type CoinmarketOffersContextValues<T extends CoinmarketTradeType> =
    CoinmarketOffersMapProps[T];
