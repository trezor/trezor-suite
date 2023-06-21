import type { Account, Network } from 'src/types/wallet';
import type { BuyInfo, saveQuotes, saveTrade } from 'src/actions/wallet/coinmarketBuyActions';
import type { FormState as ReactHookFormState } from 'react-hook-form';
import type { DefaultCountryOption, Option } from './coinmarketCommonTypes';
import type { ExchangeCoinInfo } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { SuiteUseFormReturn } from '@suite-common/wallet-types';

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

export type BuyFormContextValues = SuiteUseFormReturn<FormState> & {
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
