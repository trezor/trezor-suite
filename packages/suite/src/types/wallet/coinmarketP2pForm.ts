import { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { UseFormMethods } from 'react-hook-form';
import { Account } from 'src/types/wallet';
import { DefaultCountryOption, Option } from 'src/types/wallet/coinmarketCommonTypes';
import { TypedValidationRules } from 'src/types/wallet/form';
import { P2pInfo } from 'src/actions/wallet/coinmarketP2pActions';

export type UseCoinmarketP2pFormProps = WithSelectedAccountLoadedProps;

export type FormState = {
    fiatInput?: string;
    currencySelect: Option;
    cryptoSelect: Option;
    countrySelect: Option;
};

export type P2pFormContextValues = Omit<UseFormMethods<FormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
    account: Account;
    defaultCountry: DefaultCountryOption;
    defaultCurrency: Option;
    p2pInfo?: P2pInfo;
    isLoading: boolean;
    isDraft: boolean;
    handleClearFormButtonClick: () => void;
    onSubmit: () => void;
};
