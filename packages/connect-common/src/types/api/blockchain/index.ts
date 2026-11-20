import type { blockchainDisconnect } from './blockchainDisconnect';
import type { blockchainEstimateFee } from './blockchainEstimateFee';
import type { blockchainEvmRpcCall } from './blockchainEvmRpcCall';
import type { blockchainEvmRpcGetChainId } from './blockchainEvmRpcGetChainId';
import type { blockchainGetAccountBalanceHistory } from './blockchainGetAccountBalanceHistory';
import type { blockchainGetContractInfo } from './blockchainGetContractInfo';
import type { blockchainGetCurrentFiatRates } from './blockchainGetCurrentFiatRates';
import type { blockchainGetFiatRatesForTimestamps } from './blockchainGetFiatRatesForTimestamps';
import type { blockchainGetInfo } from './blockchainGetInfo';
import type { blockchainGetTransactions } from './blockchainGetTransactions';
import type { blockchainSetCustomBackend } from './blockchainSetCustomBackend';
import type { blockchainSubscribe } from './blockchainSubscribe';
import type { blockchainSubscribeFiatRates } from './blockchainSubscribeFiatRates';
import type { blockchainUnsubscribe } from './blockchainUnsubscribe';
import type { blockchainUnsubscribeFiatRates } from './blockchainUnsubscribeFiatRates';
import type { pushTransaction } from './pushTransaction';

// Blockchain backend operations (no device needed)
export type TrezorConnectBlockchain = {
    blockchainSubscribe: typeof blockchainSubscribe;
    blockchainUnsubscribe: typeof blockchainUnsubscribe;
    blockchainDisconnect: typeof blockchainDisconnect;
    blockchainSetCustomBackend: typeof blockchainSetCustomBackend;
    blockchainGetInfo: typeof blockchainGetInfo;
    blockchainEvmRpcGetChainId: typeof blockchainEvmRpcGetChainId;
    blockchainEstimateFee: typeof blockchainEstimateFee;
    blockchainGetAccountBalanceHistory: typeof blockchainGetAccountBalanceHistory;
    blockchainGetTransactions: typeof blockchainGetTransactions;
    blockchainEvmRpcCall: typeof blockchainEvmRpcCall;
    blockchainGetCurrentFiatRates: typeof blockchainGetCurrentFiatRates;
    blockchainGetContractInfo: typeof blockchainGetContractInfo;
    blockchainGetFiatRatesForTimestamps: typeof blockchainGetFiatRatesForTimestamps;
    blockchainSubscribeFiatRates: typeof blockchainSubscribeFiatRates;
    blockchainUnsubscribeFiatRates: typeof blockchainUnsubscribeFiatRates;
    pushTransaction: typeof pushTransaction;
};
