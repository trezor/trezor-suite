import {
    CoinmarketTradeBuyType,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeType,
} from './coinmarket';

import type { Account, Network } from 'src/types/wallet';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';
import type { BuyTrade, CryptoSymbol } from 'invity-api';
import { AmountLimits, DefaultCountryOption, Option } from '../wallet/coinmarketCommonTypes';
import { networks } from '@suite-common/wallet-config';
import { AppState } from '../suite';
import { Timer } from '@trezor/react-utils';
import { UseCoinmarketFilterReducerOutputProps } from 'src/reducers/wallet/useCoinmarketFilterReducer';

export type CoinmarketFormBuyFormProps = {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: Option;
    cryptoSelect: Option & {
        cryptoSymbol: CryptoSymbol;
        cryptoName: (typeof networks)[keyof typeof networks]['name'];
    };
    countrySelect: Option;
    paymentMethod?: Option;
};

type CoinmarketOffersBuyProps<T extends CoinmarketTradeType> = {
    type: CoinmarketTradeType;
    device: AppState['device']['selectedDevice'];
    account: Account;
    callInProgress: boolean;
    timer: Timer;
    selectQuote: (quote: CoinmarketTradeDetailMapProps[T]) => Promise<void>;
};

export type CoinmarketFormBuyFormContextProps<T extends CoinmarketTradeType> =
    UseFormReturn<CoinmarketFormBuyFormProps> &
        CoinmarketOffersBuyProps<T> & {
            account: Account;
            defaultCountry: DefaultCountryOption;
            defaultCurrency: Option;
            defaultPaymentMethod: Option;
            buyInfo?: BuyInfo;
            amountLimits?: AmountLimits;
            isLoading: boolean;
            noProviders: boolean;
            network: Network;
            cryptoInputValue?: string;
            formState: ReactHookFormState<CoinmarketFormBuyFormProps>;
            isDraft: boolean;
            quotesRequest: AppState['wallet']['coinmarket']['buy']['quotesRequest'];
            quotes: AppState['wallet']['coinmarket']['buy']['quotes'];
            selectedQuote?: BuyTrade;
            addressVerified: AppState['wallet']['coinmarket']['buy']['addressVerified'];
            providersInfo?: BuyInfo['providerInfos'];
            innerQuotesFilterReducer: UseCoinmarketFilterReducerOutputProps<CoinmarketTradeBuyType>;
            goToPayment: (address: string) => void;
            goToOffers: () => void;
            verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
            removeDraft: (key: string) => void;
            setAmountLimits: (limits?: AmountLimits) => void;
            handleClearFormButtonClick: () => void;
        };

export type CoinmarketFormMapProps = {
    buy: CoinmarketFormBuyFormContextProps<CoinmarketTradeBuyType>;
    sell: any; // TODO:
    exchange: any; // TODO:
};

export type CoinmarketFormContextValues<T extends CoinmarketTradeType> = CoinmarketFormMapProps[T];
