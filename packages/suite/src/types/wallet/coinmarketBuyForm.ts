import { AppState } from '@suite-types';
import { Account, Network } from '@wallet-types';
import {
    BuyInfo,
    saveQuoteRequest,
    saveQuotes,
    saveTrade,
    saveCachedAccountInfo,
} from '@wallet-actions/coinmarketBuyActions';
import { UseFormMethods } from 'react-hook-form';
import { TypedValidationRules } from './form';
import { DefaultCountryOption, Option } from './coinmarketCommonTypes';

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
    defaultCountry: DefaultCountryOption;
    defaultCurrency: Option;
    buyInfo?: BuyInfo;
    saveQuoteRequest: typeof saveQuoteRequest;
    saveQuotes: typeof saveQuotes;
    saveCachedAccountInfo: typeof saveCachedAccountInfo;
    saveTrade: typeof saveTrade;
    amountLimits?: AmountLimits;
    setAmountLimits: (limits?: AmountLimits) => void;
    accountHasCachedRequest: boolean;
    cachedAccountInfo: AppState['wallet']['coinmarket']['buy']['cachedAccountInfo'];
    quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
    isLoading: boolean;
    noProviders: boolean;
    network: Network;
};
