import { useContext, createContext } from 'react';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import { FeeLevel, PrecomposedTransaction, TokenInfo } from 'trezor-connect';
import { FeeInfo } from '@wallet-types/sendForm';
import { TrezorDevice, AppState } from '@suite-types';

export type Output = { id: number };

export interface SendContext {
    account: Account;
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
