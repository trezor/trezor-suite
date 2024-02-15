import type { AppState } from 'src/types/suite';
import type { FormState as ReactHookFormState, UseFormReturn } from 'react-hook-form';
import type { Account, Network } from 'src/types/wallet';
import type { FeeLevel } from '@trezor/connect';
import type { CryptoSymbol } from 'invity-api';
import type { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import type {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from 'src/types/wallet/sendForm';
import type { Option, DefaultCountryOption, AmountLimits } from './coinmarketCommonTypes';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { Rate, SendContextValues } from '@suite-common/wallet-types';

export const OUTPUT_AMOUNT = 'outputs.0.amount';
export const CRYPTO_TOKEN = 'outputs.0.token';
export const FIAT_INPUT = 'fiatInput';
export const FIAT_CURRENCY_SELECT = 'fiatCurrencySelect';
export const CRYPTO_INPUT = 'cryptoInput';
export const CRYPTO_CURRENCY_SELECT = 'cryptoCurrencySelect';

export type UseCoinmarketSellFormProps = WithSelectedAccountLoadedProps;

export type Props = WithSelectedAccountLoadedProps;

export interface SellFormState extends FormState {
    fiatInput?: string;
    fiatCurrencySelect: Option;
    cryptoInput?: string;
    cryptoCurrencySelect: Option & {
        cryptoSymbol: CryptoSymbol;
    };
    countrySelect: Option;
}

export type SellFormContextValues = UseFormReturn<SellFormState> & {
    onSubmit: () => void;
    account: Account;
    defaultCountry: DefaultCountryOption;
    defaultCurrency: Option;
    isComposing: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    sellInfo?: SellInfo;
    localCurrencyOption: { label: string; value: string };
    composeRequest: SendContextValues<SellFormState>['composeTransaction'];
    amountLimits?: AmountLimits;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    fiatRate?: Rate;
    setAmountLimits: (limits?: AmountLimits) => void;
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    isLoading: boolean;
    noProviders: boolean;
    network: Network;
    feeInfo: FeeInfo;
    onCryptoAmountChange: (amount: string) => void;
    onFiatAmountChange: (amount: string) => void;
    handleClearFormButtonClick: () => void;
    formState: ReactHookFormState<FormState>;
    isDraft: boolean;
    tokensFiatValue?: Record<string, number>;
};
