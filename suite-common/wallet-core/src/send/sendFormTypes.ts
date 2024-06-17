import {
    Account,
    FeeInfo,
    WalletAccountTransaction,
    PrecomposedTransactionFinal,
    ExcludedUtxos,
    FormState,
} from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/connect';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';

export type SerializedTx = { tx: string; coin: NetworkSymbol };

export interface ComposeActionContext {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
    excludedUtxos?: ExcludedUtxos;
    prison?: Record<string, unknown>;
}

export type EthTransactionData = {
    token?: TokenInfo;
    chainId: number;
    to: string;
    amount: string;
    data?: string;
    gasLimit: string;
    gasPrice: string;
    nonce: string;
};

export type TransactionType = WalletAccountTransaction['type'];

export type ComposeTransactionThunkArguments = {
    formValues: FormState;
    formState: ComposeActionContext;
};

export type SignTransactionThunkArguments = {
    formValues: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    selectedAccount?: Account;
};
