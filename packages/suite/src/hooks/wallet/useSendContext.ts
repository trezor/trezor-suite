import { useContext, createContext } from 'react';
import { Account } from '@wallet-types';
import { FeeLevel, ComposeOutput } from 'trezor-connect';
import { FeeInfo } from '@wallet-types/sendForm';
import { TrezorDevice, AppState } from '@suite-types';

export type Output = {
    id: number;
    address: string;
    amount: string;
    setMax: boolean;
    fiatValue: string;
    localCurrency: { value: string; label: string };
};

interface SendContext {
    account: Account;
    settings: AppState['suite']['settings'];
    device: TrezorDevice;
    online: boolean;
    fiat: AppState['wallet']['fiat'];
    locks: AppState['suite']['locks'];
    feeInfo: FeeInfo;

    transactionInfo: null | ComposeOutput;
    setTransactionInfo: (transactionInfo: ComposeOutput) => void;
    isToken: boolean;
    setIsToken: (isToken: boolean) => void;
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
