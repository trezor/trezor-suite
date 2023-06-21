import type { AppState } from 'src/types/suite';
import type { UseFormMethods, FormState as ReactHookFormState } from 'react-hook-form';
import type { Account, Network, CoinFiatRates } from 'src/types/wallet';
import type { FeeLevel } from '@trezor/connect';
import type { ExchangeTrade, ExchangeTradeQuoteRequest, ExchangeCoinInfo } from 'invity-api';
import type {
    ExchangeInfo,
    CoinmarketExchangeAction,
} from 'src/actions/wallet/coinmarketExchangeActions';
import type { TypedValidationRules } from './form';
import type {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from 'src/types/wallet/sendForm';
import type { Option } from './coinmarketCommonTypes';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { SendContextValues, SuiteUseFormReturn } from '@suite-common/wallet-types';

export const CRYPTO_INPUT = 'outputs.0.amount';
export const CRYPTO_TOKEN = 'outputs.0.token';
export const FIAT_INPUT = 'outputs.0.fiat';
export const FIAT_CURRENCY = 'outputs.0.currency';

export type UseCoinmarketExchangeFormProps = WithSelectedAccountLoadedProps;

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
    composeRequest: SendContextValues['composeTransaction'];
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
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
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
