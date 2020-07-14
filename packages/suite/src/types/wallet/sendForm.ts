import { UseFormMethods } from 'react-hook-form';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel, TokenInfo, PrecomposedTransaction } from 'trezor-connect';
import { TrezorDevice, AppState } from '@suite-types';

export type CurrencyOption = { value: string; label: string };

export type Output = {
    address: string;
    amount: string;
    fiat: string;
    currency: CurrencyOption;
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
    setMaxOutputId: number;
    // advanced form inputs
    bitcoinLockTime: string;
    ethereumGasPrice: string;
    ethereumGasLimit: string;
    ethereumData: string;
    rippleDestinationTag: string;
};

// export type PrecomposedLevels = {[key: FeeLevel['label']]: PrecomposedTransaction };
export type PrecomposedLevels = { [key: string]: PrecomposedTransaction };

export type SendContextProps = {
    account: Account;
    coinFees: FeeInfo;
    network: Network;
    device: TrezorDevice;
    online: boolean;
    fiatRates: CoinFiatRates | undefined;
    locks: AppState['suite']['locks'];
    feeInfo: FeeInfo;
    initialSelectedFee: FeeLevel;
    localCurrencyOption: { value: string; label: string };
    destinationAddressEmpty: boolean;
    transactionInfo: any; // TODO: type
    token: null | TokenInfo;
    feeOutdated: boolean;
    selectedFee: FeeLevel;
    advancedForm: boolean;
    isLoading: boolean;
    composedLevels?: PrecomposedLevels;
};

export type SendContextState = UseFormMethods<FormState> &
    SendContextProps & {
        // additional fields
        outputs: Partial<Output & { id: string }>[]; // useFieldArray fields
        addOutput: (value: Partial<Output> | Partial<Output>[], shouldFocus?: boolean) => void; // useFieldArray append
        removeOutput: (index?: number | number[] | undefined) => void; // useFieldArray remove
        updateContext: (value: Partial<SendContextProps>) => void;
        resetContext: () => void;
        composeTransaction: (outputId?: number, validateField?: string | string[]) => void;
    };
