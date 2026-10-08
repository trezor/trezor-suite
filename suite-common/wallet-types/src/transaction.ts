import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountTransaction, StaticSessionId } from '@trezor/connect';
import type { FeeInfo, RbfTransactionParams } from '@trezor/network-module-suite-common-types';
import { type RequiredKey } from '@trezor/type-utils';

import { type AccountDescriptor } from './account';

export {
    SUITE_NATIVE_PRECOMPOSE_ERRORS,
    SUITE_PRECOMPOSE_ERRORS,
    asTxTargetId,
    isFinalPrecomposedTransaction,
} from '@trezor/network-module-suite-common-types';
export type {
    BaseCurrencyOption,
    ExcludedUtxos,
    ExternalOutput,
    FeeInfo,
    FeeLevelLabel,
    GeneralPrecomposedLevels,
    GeneralPrecomposedTransaction,
    GeneralPrecomposedTransactionFinal,
    Output,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
    PrecomposedTransactionCardanoFinal,
    PrecomposedTransactionError,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalBumpFeeRbf,
    PrecomposedTransactionFinalCancelRbf,
    PrecomposedTransactionFinalCardano,
    RbfTransactionParams,
    RbfTransactionParamsBitcoin,
    RbfTransactionParamsEthereum,
    RbfTransactionType,
    SolanaTxMeta,
    TxTargetId,
} from '@trezor/network-module-suite-common-types';

export type FeesStatus = 'preloaded' | 'loading' | 'loaded' | 'error';

export type FeesState = {
    [key in LegacyNetworkSymbol]?: {
        status: FeesStatus;
        data?: FeeInfo;
    };
};

export type { EthTransactionData } from '@trezor/network-ethereum-suite-common';

export type { EvmTransactionPurpose } from '@trezor/network-ethereum-suite-common';

export interface WalletAccountTransaction extends AccountTransaction {
    deviceState: StaticSessionId;
    descriptor: AccountDescriptor;
    symbol: NetworkSymbol;
    rbfParams?: RbfTransactionParams;
    /**
     * prepending txs have deadline (blockHeight) when they should be removed from UI
     */
    deadline?: number;
}

export type WalletAccountTransactionWithRequiredRbfParams = RequiredKey<
    WalletAccountTransaction,
    'rbfParams'
>;

export interface ChainedTransactions {
    own: WalletAccountTransaction[];
    others: WalletAccountTransaction[];
}

export type TransactionType = Pick<WalletAccountTransaction, 'type'>['type'];

export type ExportFileType = 'csv' | 'pdf' | 'json';
