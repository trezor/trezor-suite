import { Account } from '@suite-common/wallet-types';
import { AppState } from '../suite';
import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import {
    BankAccount,
    BuyTrade,
    CryptoSymbol,
    ExchangeTrade,
    P2pProviderInfo,
    P2pQuote,
    P2pQuotesRequest,
    SellFiatTrade,
} from 'invity-api';
import { Timer } from '@trezor/react-utils';
import { TradeSell } from '../wallet/coinmarketCommonTypes';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { CoinmarketTradeBuyType, CoinmarketTradeType } from './coinmarket';
import { CoinmarketBuyFormContextProps } from './coinmarketForm';

type CoinmarketOffersContextProps = {
    type: CoinmarketTradeType;
    device: AppState['device']['selectedDevice'];
    account: Account;
    callInProgress: boolean;
    timer: Timer;
    getQuotes: () => Promise<void>;
    selectQuote: (quote: BuyTrade | SellFiatTrade | ExchangeTrade) => void;
};

export type CoinmarketBuyAddressOptionsType = {
    address?: string;
};

export type CoinmarketSellStepType = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

type CoinmarketSellOffersContextProps = CoinmarketOffersContextProps & {
    quotes: AppState['wallet']['coinmarket']['sell']['quotes'];
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    selectedQuote?: SellFiatTrade;
    trade?: TradeSell;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    sellInfo?: SellInfo;
    sellStep: CoinmarketSellStepType;
    setSellStep: (step: CoinmarketSellStepType) => void;
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
    quotes: AppState['wallet']['coinmarket']['exchange']['quotes'];
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    selectedQuote?: ExchangeTrade;
    setSelectedQuote: (quote?: ExchangeTrade) => void;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    addressVerified: AppState['wallet']['coinmarket']['exchange']['addressVerified'];
    exchangeInfo?: ExchangeInfo;
    exchangeStep: CoinmarketExchangeStepType;
    setExchangeStep: (step: CoinmarketExchangeStepType) => void;
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
    'getQuotes' | 'type' | 'selectQuote'
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
    buy: CoinmarketBuyFormContextProps<CoinmarketTradeBuyType>; // temporary
    sell: CoinmarketSellOffersContextProps;
    exchange: CoinmarketExchangeOffersContextProps;
};

export type CoinmarketOffersContextValues<T extends CoinmarketTradeType> =
    CoinmarketOffersMapProps[T];

export interface CoinmarketCryptoAmountProps {
    wantCrypto: boolean | undefined;
    sendAmount: string | number | undefined;
    sendCurrency: string | undefined;
    receiveAmount: string | number | undefined;
    receiveCurrency: CryptoSymbol | undefined;
    className?: string;
}
