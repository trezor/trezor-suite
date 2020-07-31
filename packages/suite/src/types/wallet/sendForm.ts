import { UseFormMethods } from 'react-hook-form';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel, TokenInfo, PrecomposedTransaction } from 'trezor-connect';
import { TrezorDevice } from '@suite-types';

export type CurrencyOption = { value: string; label: string };

export type Output = {
    type: 'payment' | 'opreturn';
    address: string;
    amount: string;
    fiat: string;
    currency: CurrencyOption;
    label?: string;
    setMax: boolean;
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

export type FormState = {
    outputs: Output[];
    // output arrays, each element is corresponding with single Output item
    setMaxOutputId?: number;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
    feeLimit: string; // ethereum only (gasLimit)
    // advanced form inputs
    bitcoinRBF: boolean;
    bitcoinLockTime?: string; // bitcoin RBF/schedule
    ethereumNonce?: string; // ethereum RBF
    rippleDestinationTag?: string;
};

// export type PrecomposedLevels = {[key: FeeLevel['label']]: PrecomposedTransaction };
export type PrecomposedLevels = { [key: string]: PrecomposedTransaction };

export type SendContextProps = {
    account: Account; // from reducer
    coinFees: FeeInfo; // from reducer
    network: Network; // from reducer
    device: TrezorDevice; // from reducer (needed?)
    online: boolean; // from reducer (needed?)
    fiatRates: CoinFiatRates | undefined; // from reducer
    // locks: AppState['suite']['locks'];
    feeInfo: FeeInfo;
    // initialSelectedFee: FeeLevel;
    localCurrencyOption: { value: string; label: string };
    destinationAddressEmpty: boolean;
    // transactionInfo: any; // TODO: type
    token: null | TokenInfo;
    feeOutdated: boolean;
    // selectedFee: FeeLevel;
    // advancedForm: boolean;
    isLoading: boolean;
    composedLevels?: PrecomposedLevels;
};

export type SendContextState = UseFormMethods<FormState> &
    SendContextProps & {
        // additional fields
        outputs: Partial<Output & { id: string }>[]; // useFieldArray fields
        addOutput: () => void; // useFieldArray append
        removeOutput: (index: number) => void; // useFieldArray remove
        updateContext: (value: Partial<SendContextProps>) => void;
        resetContext: () => void;
        composeTransaction: (field: string, fieldHasError?: boolean) => void;
        signTransaction: () => void;
        calculateFiat: (outputIndex: number, amount?: string) => void;
        changeFeeLevel: (currentLevel: FeeLevel, newLevel: FeeLevel['label']) => void;
        addOpReturn: () => void;
        removeOpReturn: (index: number) => void;
    };
