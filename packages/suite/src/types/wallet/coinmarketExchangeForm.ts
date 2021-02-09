import { AppState } from '@suite-types';
import { UseFormMethods } from 'react-hook-form';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel } from 'trezor-connect';
import { ExchangeTrade, ExchangeTradeQuoteRequest, ExchangeCoinInfo } from 'invity-api';
import { CoinmarketExchangeAction, ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';
import { TypedValidationRules } from './form';
import { FeeInfo, PrecomposedTransactionFinal } from '@wallet-types/sendForm';

export type Option = { value: string; label: string };
export type defaultCountryOption = { value: string; label?: string };

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

export type FormState = {
    sendCryptoInput?: string;
    sendCryptoSelect: Option;
    fiatInput?: string;
    fiatSelect?: Option;
    receiveCryptoSelect: Option;
    selectedFee: FeeLevel['label'];
    feePerUnit: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
};

export interface AmountLimits {
    currency: string;
    min?: number;
    max?: number;
}

export interface ComposeData {
    setMax?: boolean;
    address?: string;
    fillValue?: boolean;
    amount?: string;
    feeLevelLabel?: FeeLevel['label'];
    feePerUnit?: FeeLevel['feePerUnit'];
    feeLimit?: FeeLevel['feeLimit'];
    token?: string;
}

export type ExchangeFormContextValues = Omit<UseFormMethods<FormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    onSubmit: () => void;
    account: Account;
    isComposing: boolean;
    isMax: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    exchangeInfo?: ExchangeInfo;
    exchangeCoinInfo?: ExchangeCoinInfo[];
    localCurrencyOption: { label: string; value: string };
    setMax: (isMax: boolean) => void;
    compose: (data: ComposeData) => void;
    updateFiatCurrency: (selectedCurrency: { value: string; label: string }) => void;
    updateSendCryptoValue: (fiatValue: string, decimals: number) => void;
    saveQuoteRequest: (request: ExchangeTradeQuoteRequest) => CoinmarketExchangeAction;
    saveQuotes: (
        fixedQuotes: ExchangeTrade[],
        floatQuotes: ExchangeTrade[],
    ) => CoinmarketExchangeAction;
    saveTrade: (
        exchangeTrade: ExchangeTrade,
        account: Account,
        date: string,
    ) => CoinmarketExchangeAction;
    amountLimits?: AmountLimits;
    transactionInfo: PrecomposedTransactionFinal | null;
    token: string | undefined;
    setToken: (token: string | undefined) => void;
    fiatRates?: CoinFiatRates;
    setAmountLimits: (limits?: AmountLimits) => void;
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    isLoading: boolean;
    updateFiatValue: (amount: string) => void;
    noProviders: boolean;
    network: Network;
    feeInfo: FeeInfo;
    setIsComposing: (isComposing: boolean) => void;
};
