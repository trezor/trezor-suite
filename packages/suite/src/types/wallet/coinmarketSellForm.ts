import { AppState } from '@suite-types';
import { UseFormMethods, FormState as ReactHookFormState } from 'react-hook-form';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel } from 'trezor-connect';
import { SellFiatTrade, SellFiatTradeQuoteRequest, ExchangeCoinInfo } from 'invity-api';
import { CoinmarketSellAction, SellInfo } from '@wallet-actions/coinmarketSellActions';
import { TypedValidationRules } from './form';
import { FeeInfo, FormState, PrecomposedLevels } from '@wallet-types/sendForm';
import { Option, DefaultCountryOption } from './coinmarketCommonTypes';

export const OUTPUT_AMOUNT = 'outputs[0].amount';
export const FIAT_INPUT = 'fiatInput';
export const FIAT_CURRENCY_SELECT = 'fiatCurrencySelect';
export const CRYPTO_INPUT = 'cryptoInput';
export const CRYPTO_CURRENCY_SELECT = 'cryptoCurrencySelect';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    fiat: AppState['wallet']['fiat'];
    device: AppState['suite']['device'];
    localCurrency: AppState['wallet']['settings']['localCurrency'];
    fees: AppState['wallet']['fees'];
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    exchangeCoinInfo: AppState['wallet']['coinmarket']['exchange']['exchangeCoinInfo'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

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
    composedLevels?: PrecomposedLevels;
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
};
