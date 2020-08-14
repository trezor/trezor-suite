import { UseFormMethods } from 'react-hook-form';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import {
    FeeLevel,
    TokenInfo,
    PrecomposedTransaction as PrecomposedTransactionBase,
} from 'trezor-connect';
import { TrezorDevice } from '@suite-types';

export type CurrencyOption = { value: string; label: string };

export type Output = {
    type: 'payment' | 'opreturn';
    address: string;
    amount: string;
    fiat: string;
    currency: CurrencyOption;
    label?: string;
    token?: string;
    dataHex: string; // bitcoin opreturn/ethereum data
    dataAscii: string; // bitcoin opreturn/ethereum data
};

export interface FeeInfo {
    blockHeight: number; // when fee info was updated; 0 = never
    blockTime: number; // how often block is mined
    minFee: number;
    maxFee: number;
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in trezor-connect > trezor-firmware/common
}

export type EthTransactionData = {
    token?: TokenInfo;
    chainId: Network['chainId'];
    to: string;
    amount: string;
    data?: string;
    gasLimit: string;
    gasPrice: string;
    nonce: string;
};

export type FormOptions =
    | 'broadcast'
    | 'bitcoinRBF'
    | 'bitcoinLockTime'
    | 'ethereumData'
    | 'ethereumNonce' // TODO
    | 'rippleDestinationTag';

export type FormState = {
    outputs: Output[];
    // output arrays, each element is corresponding with single Output item
    setMaxOutputId?: number;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
    feeLimit: string; // ethereum only (gasLimit)
    // advanced form inputs
    options: FormOptions[];
    bitcoinLockTime?: string; // bitcoin RBF/schedule
    ethereumNonce?: string; // TODO: ethereum RBF
    ethereumDataAscii?: string;
    ethereumDataHex?: string;
    rippleDestinationTag?: string;
};

export type PrecomposedTransactionError = Extract<PrecomposedTransactionBase, { type: 'error' }> & {
    error: string; // TODO: type TR_
};

export type PrecomposedTransactionNonFinal = Extract<
    PrecomposedTransactionBase,
    { type: 'nonfinal' }
> & {
    max: string | undefined;
    feeLimit?: string;
    token?: TokenInfo;
};

export type PrecomposedTransactionFinal = Extract<PrecomposedTransactionBase, { type: 'final' }> & {
    max: string | undefined;
    feeLimit?: string;
    token?: TokenInfo;
};

export type PrecomposedTransaction =
    | PrecomposedTransactionError
    | PrecomposedTransactionNonFinal
    | PrecomposedTransactionFinal;

export type PrecomposedLevels = { [key: string]: PrecomposedTransaction };

export type SendContextProps = {
    account: Account; // from reducer
    coinFees: FeeInfo; // from reducer
    network: Network; // from reducer
    device: TrezorDevice; // from reducer (needed?)
    online: boolean; // from reducer (needed?)
    fiatRates: CoinFiatRates | undefined; // from reducer
    feeInfo: FeeInfo;
    localCurrencyOption: { value: string; label: string };
    destinationAddressEmpty: boolean;
    feeOutdated: boolean;
    isLoading: boolean;
    composedLevels?: PrecomposedLevels;
};

interface GetDefaultValue {
    <K extends keyof FormState, T = undefined>(
        fieldName: K,
        fallback?: T,
    ): K extends keyof FormState ? FormState[K] : unknown;
    <K, T>(fieldName: K, fallback: T): K extends keyof FormState ? FormState[K] : T;
}

export type SendContextState = UseFormMethods<FormState> &
    SendContextProps & {
        // additional fields
        outputs: Partial<Output & { id: string }>[]; // useFieldArray fields
        updateContext: (value: Partial<SendContextProps>) => void;
        resetContext: () => void;
        composeTransaction: (field: string, fieldHasError?: boolean) => void;
        signTransaction: () => void;
        // useSendFormFields utils:
        calculateFiat: (outputIndex: number, amount?: string) => void;
        setAmount: (outputIndex: number, amount: string) => void;
        changeFeeLevel: (currentLevel: FeeLevel, newLevel: FeeLevel['label']) => void;
        resetDefaultValue: (field: string) => void;
        setMax: (index: number, active: boolean) => void;
        getDefaultValue: GetDefaultValue;
        toggleOption: (option: FormOptions) => void;
        // useSendFormOutputs utils:
        addOutput: () => void; // useFieldArray append
        removeOutput: (index: number) => void; // useFieldArray remove
        addOpReturn: () => void;
        removeOpReturn: (index: number) => void;
    };
