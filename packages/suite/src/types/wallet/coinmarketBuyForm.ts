import type { Account, Network } from 'src/types/wallet';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';
import type { AmountLimits, DefaultCountryOption, Option } from './coinmarketCommonTypes';
import type { CryptoSymbol } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';

export type UseCoinmarketBuyFormProps = WithSelectedAccountLoadedProps;

export type Props = WithSelectedAccountLoadedProps;

export type FormState = {
    fiatInput?: string;
    cryptoInput?: string;
    currencySelect: Option;
    cryptoSelect: Option & {
        cryptoSymbol: CryptoSymbol;
    };
    countrySelect: Option;
};

export type BuyFormContextValues = UseFormReturn<FormState> & {
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
    formState: ReactHookFormState<FormState>;
    isDraft: boolean;
    handleClearFormButtonClick: () => void;
};
