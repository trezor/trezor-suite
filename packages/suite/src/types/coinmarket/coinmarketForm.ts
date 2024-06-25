import {
    CoinmarketCryptoListProps,
    CoinmarketPaymentMethodListProps,
    CoinmarketPaymentMethodProps,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import type { Account, Network } from 'src/types/wallet';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';
import type { BuyTrade, FiatCurrencyCode } from 'invity-api';
import { Timer } from '@trezor/react-utils';
import { AppState } from 'src/reducers/store';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { AmountLimits, DefaultCountryOption, Option } from 'src/types/wallet/coinmarketCommonTypes';

export type CoinmarketBuyFormProps = {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: Option;
    cryptoSelect: CoinmarketCryptoListProps;
    countrySelect: Option;
    paymentMethod?: CoinmarketPaymentMethodListProps;
};

export type CoinmarketBuyFormDefaultValuesProps = {
    defaultValues: CoinmarketBuyFormProps;
    defaultCountry: Option;
    defaultCurrency: Option;
    defaultPaymentMethod: CoinmarketPaymentMethodListProps;
    suggestedFiatCurrency: FiatCurrencyCode;
};

type CoinmarketOffersBuyProps = {
    type: CoinmarketTradeType;
    device: AppState['device']['selectedDevice'];
    account: Account;
    callInProgress: boolean;
    timer: Timer;
    selectQuote: (quote: BuyTrade) => Promise<void>;
};

export type CoinmarketBuyFormContextProps = UseFormReturn<CoinmarketBuyFormProps> &
    CoinmarketOffersBuyProps & {
        account: Account;
        defaultCountry: DefaultCountryOption;
        defaultCurrency: Option;
        defaultPaymentMethod: CoinmarketPaymentMethodListProps;
        paymentMethods: CoinmarketPaymentMethodListProps[];
        buyInfo?: BuyInfo;
        amountLimits?: AmountLimits;
        network: Network;
        cryptoInputValue?: string;
        formState: ReactHookFormState<CoinmarketBuyFormProps>;
        isDraft: boolean;
        quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
        quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
        selectedQuote: BuyTrade | undefined;
        addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
        form: {
            state: {
                isFormLoading: boolean;
                isFormInvalid: boolean;
                isLoadingOrInvalid: boolean;
            };
        };
        goToPayment: (address: string) => void;
        goToOffers: () => Promise<void>;
        verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
        removeDraft: (key: string) => void;
        setAmountLimits: (limits?: AmountLimits) => void;
    };

export type CoinmarketFormMapProps = {
    buy: CoinmarketBuyFormContextProps;
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

export type CoinmarketFormInputLabelProps = {
    label?: ExtendedMessageDescriptor['id'];
};

export type CoinmarketFormInputProps = CoinmarketFormInputLabelProps & {
    className?: string;
};
