import {
    CoinmarketCryptoListProps,
    CoinmarketPaymentMethodListProps,
    CoinmarketPaymentMethodProps,
    CoinmarketTradeBuyType,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeType,
} from './coinmarket';

import type { Account, Network } from 'src/types/wallet';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';
import type { BuyTrade } from 'invity-api';
import { AmountLimits, DefaultCountryOption, Option } from '../wallet/coinmarketCommonTypes';
import { AppState } from '../suite';
import { Timer } from '@trezor/react-utils';

export type CoinmarketBuyFormProps = {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: Option;
    cryptoSelect: CoinmarketCryptoListProps;
    countrySelect: Option;
    paymentMethod?: CoinmarketPaymentMethodListProps;
};

export type CoinmarketBuyFormDefaultValuesProps = {
    defaultValues: CoinmarketBuyFormProps | undefined;
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: CoinmarketPaymentMethodListProps;
};

type CoinmarketOffersBuyProps<T extends CoinmarketTradeType> = {
    type: CoinmarketTradeType;
    device: AppState['device']['selectedDevice'];
    account: Account;
    callInProgress: boolean;
    timer: Timer;
    selectQuote: (quote: CoinmarketTradeDetailMapProps[T]) => Promise<void>;
};

export type CoinmarketBuyFormContextProps<T extends CoinmarketTradeType> =
    UseFormReturn<CoinmarketBuyFormProps> &
        CoinmarketOffersBuyProps<T> & {
            account: Account;
            defaultCountry: DefaultCountryOption;
            defaultCurrency: Option;
            defaultPaymentMethod: CoinmarketPaymentMethodListProps;
            paymentMethods: CoinmarketPaymentMethodListProps[];
            buyInfo?: BuyInfo;
            amountLimits?: AmountLimits;
            isLoading: boolean;
            noProviders: boolean;
            network: Network;
            cryptoInputValue?: string;
            formState: ReactHookFormState<CoinmarketBuyFormProps>;
            isDraft: boolean;
            quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
            quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
            selectedQuote: BuyTrade | undefined;
            addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
            providersInfo: BuyInfo['providerInfos'] | undefined;
            goToPayment: (address: string) => void;
            goToOffers: () => void;
            verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
            removeDraft: (key: string) => void;
            setAmountLimits: (limits?: AmountLimits) => void;
            handleClearFormButtonClick: () => void;
        };

export type CoinmarketFormMapProps = {
    buy: CoinmarketBuyFormContextProps<CoinmarketTradeBuyType>;
    sell: any; // TODO:
    exchange: any; // TODO:
};

export type CoinmarketFormContextValues<T extends CoinmarketTradeType> = CoinmarketFormMapProps[T];

export type CoinmarketPaymentMethodHookProps<T extends CoinmarketTradeType> = {
    paymentMethods: CoinmarketPaymentMethodListProps[];
    getPaymentMethods: (
        quotes: CoinmarketTradeDetailMapProps[T][],
    ) => CoinmarketPaymentMethodListProps[];
    getQuotesByPaymentMethod: (
        quotes: CoinmarketTradeDetailMapProps[T][] | undefined,
        currentPaymentMethod: CoinmarketPaymentMethodProps,
    ) => CoinmarketTradeDetailMapProps[T][] | undefined;
};
