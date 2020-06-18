import { useContext, createContext } from 'react';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel, PrecomposedTransaction, TokenInfo } from 'trezor-connect';
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

export interface SendContext {
    defaultValues: {
        'address-0': string;
        'amount-0': string;
        'setMax-0': boolean;
        'fiatInput-0': string;
        'localCurrency-0': { value: string; label: string };
        ethereumGasPrice: string;
        ethereumGasLimit: string;
        ethereumData: string;
        rippleDestinationTag: string;
    };
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
    setDestinationAddressEmpty: (isEmpty: boolean) => void;
    transactionInfo: null | PrecomposedTransaction;
    setTransactionInfo: (transactionInfo: null | PrecomposedTransaction) => void;
    token: null | TokenInfo;
    setToken: (token: TokenInfo | null) => void;
    feeOutdated: boolean;
    setFeeOutdated: (isOutdated: boolean) => void;
    selectedFee: FeeLevel;
    setSelectedFee: (selectedFee: FeeLevel) => void;
    advancedForm: boolean;
    showAdvancedForm: (isVisible: boolean) => void;
    outputs: Output[];
    updateOutputs: (outputs: Output[]) => void;
}

export const SendContext = createContext<SendContext | null>(null);

export const useSendContext = () => {
    const sendContext = useContext(SendContext);
    if (sendContext == null) throw Error('sendContext: Please provide sendContext value.');
    return sendContext;
};
