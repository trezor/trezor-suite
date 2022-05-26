import type { Account, Network } from '@wallet-types';
import type { BuyInfo, saveQuotes, saveTrade } from '@wallet-actions/coinmarketBuyActions';
import type { UseFormMethods, FormState as ReactHookFormState } from 'react-hook-form';
import type { TypedValidationRules } from './form';
import type { DefaultCountryOption, Option } from './coinmarketCommonTypes';
import type { ExchangeCoinInfo } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseCoinmarketBuyFormProps = WithSelectedAccountLoadedProps;

export type Props = WithSelectedAccountLoadedProps;

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
    exchangeCoinInfo?: ExchangeCoinInfo[];
    saveQuotes: typeof saveQuotes;
    saveTrade: typeof saveTrade;
    amountLimits?: AmountLimits;
    setAmountLimits: (limits?: AmountLimits) => void;
    isLoading: boolean;
    noProviders: boolean;
    network: Network;
    cryptoInputValue?: string;
    removeDraft: (key: string) => void;
    formState: ReactHookFormState<FormState>;
    isDraft: boolean;
    handleClearFormButtonClick: () => void;
};
