import { CoinmarketTradeType } from './coinmarket';

import type { Account, Network } from 'src/types/wallet';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';
import type { CryptoSymbol } from 'invity-api';
import { AmountLimits, DefaultCountryOption, Option } from '../wallet/coinmarketCommonTypes';

export type CoinmarketFormBuyFormProps = {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: Option;
    cryptoSelect: Option & {
        cryptoSymbol: CryptoSymbol;
    };
    countrySelect: Option;
    paymentMethod?: Option;
};

export type CoinmarketFormBuyFormContextProps = UseFormReturn<CoinmarketFormBuyFormProps> & {
    onSubmit: () => void;
    account: Account;
    defaultCountry: DefaultCountryOption;
    defaultCurrency: Option;
    buyInfo?: BuyInfo;
    amountLimits?: AmountLimits;
    setAmountLimits: (limits?: AmountLimits) => void;
    isLoading: boolean;
    noProviders: boolean;
    network: Network;
    cryptoInputValue?: string;
    removeDraft: (key: string) => void;
    formState: ReactHookFormState<CoinmarketFormBuyFormProps>;
    isDraft: boolean;
    handleClearFormButtonClick: () => void;
};

export type CoinmarketFormMapProps = {
    buy: CoinmarketFormBuyFormContextProps;
    sell: any; // TODO:
    exchange: any; // TODO:
};

export type CoinmarketFormContextValues<T extends CoinmarketTradeType> = CoinmarketFormMapProps[T];
