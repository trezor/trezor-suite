import { AppState } from '@suite-types';
import { Account, Network } from '@wallet-types';
import { BuyTradeQuoteRequest, BuyTrade } from 'invity-api';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { UseFormMethods } from 'react-hook-form';
import { TypedValidationRules } from './form';

export type Option = { value: string; label: string };
export type defaultCountryOption = { value: string; label?: string };

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    cachedAccountInfo: AppState['wallet']['coinmarket']['buy']['cachedAccountInfo'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export type FormState = {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: Option;
    cryptoSelect: Option;
    countrySelect: Option;
};

export interface AmountLimits {
    currency: string;
    minCrypto?: number;
    minFiat?: number;
    maxCrypto?: number;
    maxFiat?: number;
}

export type BuyFormContextValues = Omit<UseFormMethods<FormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    onSubmit: () => void;
    account: Account;
    defaultCountry: defaultCountryOption;
    defaultCurrency: Option;
    buyInfo?: BuyInfo;
    saveQuoteRequest: (request: BuyTradeQuoteRequest) => Promise<void>;
    saveQuotes: (quotes: BuyTrade[], alternativeQuotes: BuyTrade[] | undefined) => Promise<void>;
    saveCachedAccountInfo: (
        symbol: Account['symbol'],
        index: number,
        accountType: Account['accountType'],
    ) => Promise<void>;
    saveTrade: (buyTrade: BuyTrade, account: Account, date: string) => Promise<void>;
    amountLimits?: AmountLimits;
    setAmountLimits: (limits?: AmountLimits) => void;
    accountHasCachedRequest: boolean;
    cachedAccountInfo: AppState['wallet']['coinmarket']['buy']['cachedAccountInfo'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    isLoading: boolean;
    noProviders: boolean;
    network: Network;
};
