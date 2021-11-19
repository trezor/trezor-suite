import { AppState } from '@suite-types';
import { UseFormMethods, FormState as ReactHookFormState } from 'react-hook-form';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel } from 'trezor-connect';
import { ExchangeTrade, ExchangeTradeQuoteRequest, ExchangeCoinInfo } from 'invity-api';
import { CoinmarketExchangeAction, ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';
import { TypedValidationRules } from './form';
import { FeeInfo, FormState, PrecomposedLevels } from '@wallet-types/sendForm';
import { Option } from './coinmarketCommonTypes';

export const CRYPTO_INPUT = 'outputs[0].amount';
export const CRYPTO_TOKEN = 'outputs[0].token';
export const FIAT_INPUT = 'outputs[0].fiat';
export const FIAT_CURRENCY = 'outputs[0].currency';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    fiat: AppState['wallet']['fiat'];
    device: AppState['suite']['device'];
    localCurrency: AppState['wallet']['settings']['localCurrency'];
    fees: AppState['wallet']['fees'];
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    exchangeCoinInfo: AppState['wallet']['coinmarket']['exchange']['exchangeCoinInfo'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export type ExchangeFormState = FormState & {
    // NOTE: react-select value type cannot be undefined, but at least null works
    receiveCryptoSelect: Option | null;
    sendCryptoSelect: Option;
};

export interface AmountLimits {
    currency: string;
    min?: number;
    max?: number;
}

export type ExchangeFormContextValues = Omit<UseFormMethods<ExchangeFormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    onSubmit: () => void;
    account: Account;
    isComposing: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    exchangeInfo?: ExchangeInfo;
    exchangeCoinInfo?: ExchangeCoinInfo[];
    defaultCurrency: Option;
    composeRequest: (field?: string) => void;
    updateFiatCurrency: (selectedCurrency: { value: string; label: string }) => void;
    updateSendCryptoValue: (fiatValue: string, decimals: number) => void;
    saveQuoteRequest: (request: ExchangeTradeQuoteRequest) => CoinmarketExchangeAction;
    saveQuotes: (
        fixedQuotes: ExchangeTrade[],
        floatQuotes: ExchangeTrade[],
        dexQuotes: ExchangeTrade[],
    ) => CoinmarketExchangeAction;
    saveTrade: (
        exchangeTrade: ExchangeTrade,
        account: Account,
        date: string,
    ) => CoinmarketExchangeAction;
    amountLimits?: AmountLimits;
    composedLevels?: PrecomposedLevels;
    fiatRates?: CoinFiatRates;
    setAmountLimits: (limits?: AmountLimits) => void;
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    isLoading: boolean;
    updateFiatValue: (amount: string) => void;
    noProviders: boolean;
    network: Network;
    feeInfo: FeeInfo;
    removeDraft: (key: string) => void;
    formState: ReactHookFormState<ExchangeFormState>;
    handleClearFormButtonClick: () => void;
    isDraft: boolean;
};
