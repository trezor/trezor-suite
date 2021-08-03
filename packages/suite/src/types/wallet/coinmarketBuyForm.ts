import { AppState } from '@suite-types';
import { Account, Network } from '@wallet-types';
import { BuyInfo, saveQuotes, saveTrade } from '@wallet-actions/coinmarketBuyActions';
import { UseFormMethods, FormState as ReactHookFormState } from 'react-hook-form';
import { TypedValidationRules } from './form';
import { DefaultCountryOption, Option } from './coinmarketCommonTypes';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
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
