import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel, TokenInfo } from 'trezor-connect';
import { TrezorDevice, AppState } from '@suite-types';

export type Output = { id: number };

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

type Max = 'active' | 'inactive';
type LocalCurrencyOption = { value: string; label: string };

export type FormState = {
    // output arrays, each element is corresponding with single Output item
    address: string[];
    amount: string[];
    setMax: Max[];
    setMaxOutputId: number;
    fiatInput: string[];
    localCurrency: LocalCurrencyOption[];
    // advanced form inputs
    bitcoinLockTime: string;
    ethereumGasPrice: string;
    ethereumGasLimit: string;
    ethereumData: string;
    rippleDestinationTag: string;
    // various common props
};

export type ContextStateValues = {
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
    outputs: Output[];
    isLoading: boolean;
};

export type ContextState = ContextStateValues & {
    updateContext: (value: Partial<ContextState>) => void;
    resetContext: () => void;
};
