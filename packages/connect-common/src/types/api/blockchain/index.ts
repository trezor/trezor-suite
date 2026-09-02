import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

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
export const TrezorConnectBlockchain = Type.Object({
    blockchainSubscribe: Type.Unsafe<typeof blockchainSubscribe>(),
    blockchainUnsubscribe: Type.Unsafe<typeof blockchainUnsubscribe>(),
    blockchainDisconnect: Type.Unsafe<typeof blockchainDisconnect>(),
    blockchainSetCustomBackend: Type.Unsafe<typeof blockchainSetCustomBackend>(),
    blockchainGetInfo: Type.Unsafe<typeof blockchainGetInfo>(),
    blockchainEvmRpcGetChainId: Type.Unsafe<typeof blockchainEvmRpcGetChainId>(),
    blockchainEstimateFee: Type.Unsafe<typeof blockchainEstimateFee>(),
    blockchainGetAccountBalanceHistory: Type.Unsafe<typeof blockchainGetAccountBalanceHistory>(),
    blockchainGetTransactions: Type.Unsafe<typeof blockchainGetTransactions>(),
    blockchainEvmRpcCall: Type.Unsafe<typeof blockchainEvmRpcCall>(),
    blockchainGetCurrentFiatRates: Type.Unsafe<typeof blockchainGetCurrentFiatRates>(),
    blockchainGetContractInfo: Type.Unsafe<typeof blockchainGetContractInfo>(),
    blockchainGetFiatRatesForTimestamps: Type.Unsafe<typeof blockchainGetFiatRatesForTimestamps>(),
    blockchainSubscribeFiatRates: Type.Unsafe<typeof blockchainSubscribeFiatRates>(),
    blockchainUnsubscribeFiatRates: Type.Unsafe<typeof blockchainUnsubscribeFiatRates>(),
    pushTransaction: Type.Unsafe<typeof pushTransaction>(),
});
export type TrezorConnectBlockchain = Static<typeof TrezorConnectBlockchain>;
