import type { AppState } from 'src/types/suite';
import type { UseFormMethods, FormState as ReactHookFormState } from 'react-hook-form';
import type { Account, Network, CoinFiatRates } from 'src/types/wallet';
import type { FeeLevel } from '@trezor/connect';
import type { SellFiatTrade, SellFiatTradeQuoteRequest, ExchangeCoinInfo } from 'invity-api';
import type { CoinmarketSellAction, SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import type { TypedValidationRules } from './form';
import type {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from 'src/types/wallet/sendForm';
import type { Option, DefaultCountryOption } from './coinmarketCommonTypes';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';

export const OUTPUT_AMOUNT = 'outputs[0].amount';
export const CRYPTO_TOKEN = 'outputs[0].token';
export const FIAT_INPUT = 'fiatInput';
export const FIAT_CURRENCY_SELECT = 'fiatCurrencySelect';
export const CRYPTO_INPUT = 'cryptoInput';
export const CRYPTO_CURRENCY_SELECT = 'cryptoCurrencySelect';

export type UseCoinmarketSellFormProps = WithSelectedAccountLoadedProps;

export type Props = WithSelectedAccountLoadedProps;

export type SellFormState = FormState & {
    fiatInput?: string;
    fiatCurrencySelect: Option;
    cryptoInput?: string;
    cryptoCurrencySelect: Option;
    countrySelect: Option;
};

export interface AmountLimits {
    currency: string;
    minCrypto?: number;
    minFiat?: number;
    maxCrypto?: number;
    maxFiat?: number;
}

export type SellFormContextValues = Omit<UseFormMethods<SellFormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    onSubmit: () => void;
    account: Account;
    defaultCountry: DefaultCountryOption;
    defaultCurrency: Option;
    isComposing: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    sellInfo?: SellInfo;
    exchangeCoinInfo?: ExchangeCoinInfo[];
    localCurrencyOption: { label: string; value: string };
    composeRequest: (field?: string) => void;
    saveQuoteRequest: (request: SellFiatTradeQuoteRequest) => CoinmarketSellAction;
    saveQuotes: (
        fixedQuotes: SellFiatTrade[],
        floatQuotes: SellFiatTrade[],
    ) => CoinmarketSellAction;
    saveTrade: (sellTrade: SellFiatTrade, account: Account, date: string) => CoinmarketSellAction;
    amountLimits?: AmountLimits;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    fiatRates?: CoinFiatRates;
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
    activeInput: 'fiatInput' | 'cryptoInput';
    setActiveInput: React.Dispatch<React.SetStateAction<SellFormContextValues['activeInput']>>;
};
