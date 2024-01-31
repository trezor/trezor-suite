import type { AppState } from 'src/types/suite';
import type { FormState as ReactHookFormState, UseFormReturn } from 'react-hook-form';
import type { Account, Network, CoinFiatRates } from 'src/types/wallet';
import type { FeeLevel } from '@trezor/connect';
import type { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import type {
    FeeInfo,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from 'src/types/wallet/sendForm';
import type { AmountLimits, CryptoAmountLimits, Option } from './coinmarketCommonTypes';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { SendContextValues } from '@suite-common/wallet-types';
import { CryptoSymbol, CryptoSymbolInfo } from 'invity-api';

export const CRYPTO_INPUT = 'outputs.0.amount';
export const CRYPTO_TOKEN = 'outputs.0.token';
export const FIAT_INPUT = 'outputs.0.fiat';
export const FIAT_CURRENCY = 'outputs.0.currency';

export type UseCoinmarketExchangeFormProps = WithSelectedAccountLoadedProps;

export type ExchangeFormState = FormState & {
    // NOTE: react-select value type cannot be undefined, but at least null works
    receiveCryptoSelect: (Option & { cryptoSymbol?: CryptoSymbol }) | null;
    sendCryptoSelect: Option & { cryptoSymbol?: CryptoSymbol };
};

export interface ExchangeFormContextValues extends UseFormReturn<ExchangeFormState> {
    onSubmit: () => void;
    account: Account;
    isComposing: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    exchangeInfo?: ExchangeInfo;
    symbolsInfo?: CryptoSymbolInfo[];
    defaultCurrency: Option;
    composeRequest: SendContextValues['composeTransaction'];
    updateFiatCurrency: (selectedCurrency: { value: string; label: string }) => void;
    updateSendCryptoValue: (fiatValue: string, decimals: number) => void;
    amountLimits?: AmountLimits;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    fiatRates?: CoinFiatRates;
    setAmountLimits: (limits?: CryptoAmountLimits) => void;
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
    tokensFiatValue?: Record<string, number>;
}
