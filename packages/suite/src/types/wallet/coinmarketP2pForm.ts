import { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { Account } from 'src/types/wallet';
import { DefaultCountryOption, Option } from 'src/types/wallet/coinmarketCommonTypes';
import { P2pInfo } from 'src/actions/wallet/coinmarketP2pActions';
import { UseFormReturn } from 'react-hook-form';

export type UseCoinmarketP2pFormProps = WithSelectedAccountLoadedProps;

export type FormState = {
    fiatInput?: string;
    currencySelect: Option;
    cryptoSelect: Option;
    countrySelect: Option;
};

export interface P2pFormContextValues extends UseFormReturn<FormState> {
    account: Account;
    defaultCountry: DefaultCountryOption;
    defaultCurrency: Option;
    p2pInfo?: P2pInfo;
    isLoading: boolean;
    isDraft: boolean;
    handleClearFormButtonClick: () => void;
    onSubmit: () => void;
}
