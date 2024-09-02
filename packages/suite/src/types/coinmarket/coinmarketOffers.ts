import { Account } from '@suite-common/wallet-types';
import { AppState } from '../suite';
import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import { BankAccount, CryptoId, ExchangeTrade, SellFiatTrade } from 'invity-api';
import { Timer } from '@trezor/react-utils';
import { TradeSell } from '../wallet/coinmarketCommonTypes';
import { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import { CoinmarketTradeType } from './coinmarket';
import {
    CoinmarketBuyFormContextProps,
    CoinmarketExchangeFormContextProps,
    CoinmarketSellFormContextProps,
} from './coinmarketForm';

type CoinmarketOffersContextProps = {
    type: CoinmarketTradeType;
    device: AppState['device']['selectedDevice'];
    account: Account;
    callInProgress: boolean;
    timer: Timer;
    getQuotes: () => Promise<void>;
};

export type CoinmarketBuyAddressOptionsType = {
    address?: string;
};

export type CoinmarketSellStepType = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

export type CoinmarketSellOffersContextProps = CoinmarketOffersContextProps & {
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
    selectQuote: (quote: SellFiatTrade) => void;
};

export type CoinmarketExchangeStepType =
    | 'RECEIVING_ADDRESS'
    | 'SEND_TRANSACTION'
    | 'SEND_APPROVAL_TRANSACTION';

export type CoinmarketExchangeOffersContextProps = CoinmarketOffersContextProps & {
    quotes: AppState['wallet']['coinmarket']['exchange']['quotes'];
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    selectedQuote?: ExchangeTrade;
    setSelectedQuote: (quote: ExchangeTrade | undefined) => void;
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
    selectQuote: (quote: ExchangeTrade) => void;
};

// TODO: delete
export type CoinmarketOffersMapProps = {
    buy: CoinmarketBuyFormContextProps; // temporary
    sell: CoinmarketSellFormContextProps; // temporary
    exchange: CoinmarketExchangeFormContextProps; // temporary
};

export type CoinmarketOffersContextValues<T extends CoinmarketTradeType> =
    CoinmarketOffersMapProps[T];

export interface CoinmarketCryptoAmountProps {
    amountInCrypto?: boolean | undefined;
    sendAmount: string | number | undefined;
    sendCurrency: CryptoId | string | undefined;
    receiveAmount: string | number | undefined;
    receiveCurrency: CryptoId | undefined;
    className?: string;
}
