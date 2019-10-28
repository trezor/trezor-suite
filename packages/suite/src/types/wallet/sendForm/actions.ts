import { SEND } from '@wallet-actions/constants';
import { Account } from '@wallet-types';
import { FeeLevel as FeeLevelBase } from 'trezor-connect';
import { Output } from './output';
import { InitialState } from './state';

export interface FeeLevel extends FeeLevelBase {
    value: string;
}

interface AddressChange {
    type: typeof SEND.HANDLE_ADDRESS_CHANGE;
    outputId: number;
    address: string;
    symbol: Account['symbol'];
    networkType: Account['networkType'];
    currentAccountAddress: string;
}

interface AmountChange {
    type: typeof SEND.HANDLE_AMOUNT_CHANGE;
    outputId: number;
    amount: string;
    decimals: number;
    availableBalance: Account['availableBalance'];
}

interface SetMax {
    type: typeof SEND.SET_MAX;
    outputId: number;
}

interface ComposeProgress {
    type: typeof SEND.COMPOSE_PROGRESS;
    isComposing: boolean;
}

interface FiatValueChange {
    type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE;
    outputId: number;
    fiatValue: string;
}

interface FeeValueChange {
    type: typeof SEND.HANDLE_FEE_VALUE_CHANGE;
    fee: FeeLevel;
}

interface CustomFeeValueChange {
    type: typeof SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE;
    customFee: string | null;
}

interface CurrencyChange {
    type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
    outputId: number;
    localCurrency: Output['localCurrency']['value'];
}

interface AdditionalFormVisibility {
    type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY;
}

interface Clear {
    type: typeof SEND.CLEAR;
    localCurrency: Output['localCurrency']['value'];
}

interface DeleteTransactionInfo {
    type: typeof SEND.DELETE_TRANSACTION_INFO;
    networkType: Account['networkType'];
}

interface Init {
    type: typeof SEND.INIT;
    payload: InitialState;
    localCurrency: Output['localCurrency']['value'];
}

interface Dispose {
    type: typeof SEND.DISPOSE;
}

export type Actions =
    | AddressChange
    | AmountChange
    | SetMax
    | ComposeProgress
    | FiatValueChange
    | FeeValueChange
    | CustomFeeValueChange
    | CurrencyChange
    | AdditionalFormVisibility
    | Clear
    | DeleteTransactionInfo
    | Init
    | Dispose;
