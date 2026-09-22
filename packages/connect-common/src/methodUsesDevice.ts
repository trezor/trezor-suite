import { type CallMethodPayload } from './events/call';

/**
 * Methods whose implementation in `packages/connect-core/src/api` sets `this.useDevice = false`
 * unconditionally. Core short-circuits these without acquiring the device, so a host has no
 * reason to serialize them against device calls.
 *
 * `methodUsesDevice.test.ts` in `@trezor/connect-core` fails if this drifts from the
 * implementations, which is the only thing keeping the two in step.
 */
export const methodsWithoutDevice: readonly string[] = [
    'blockchainDisconnect',
    'blockchainEstimateFee',
    'blockchainEvmRpcCall',
    'blockchainEvmRpcGetChainId',
    'blockchainGetAccountBalanceHistory',
    'blockchainGetContractInfo',
    'blockchainGetCurrentFiatRates',
    'blockchainGetFiatRatesForTimestamps',
    'blockchainGetInfo',
    'blockchainGetTransactions',
    'blockchainSetCustomBackend',
    'blockchainSubscribe',
    'blockchainSubscribeFiatRates',
    'blockchainUnsubscribe',
    'blockchainUnsubscribeFiatRates',
    'cardanoComposeTransaction',
    'composePsbt',
    'composeTransaction',
    'getCoinInfo',
    'getSettings',
    'pushTransaction',
    'selectAccount',
    'solanaComposeTransaction',
    'tronComposeTransaction',
];

/**
 * Methods that decide per call. Listed separately so the drift test can require every conditional
 * implementation to have a counterpart here instead of silently defaulting to "uses device".
 */
export const methodsWithConditionalDevice: readonly string[] = [
    'getAccountInfo',
    'thpRemoveCredentials',
];

// `getAccountInfo` only derives on the device when a batch has no descriptor to work from.
const accountInfoBatchUsesDevice = (batch: { path?: string; descriptor?: string }) =>
    batch.path !== undefined && typeof batch.descriptor !== 'string';

/**
 * Whether a call needs the physical device, matching what `@trezor/connect-core` will decide for
 * the same params. Hosts use it to serialize device calls — `Device.run` rejects overlapping ones
 * with `Device_CallInProgress` rather than queueing them — and to reflect "device busy" in their UI.
 */
export const methodUsesDevice = (params: CallMethodPayload): boolean => {
    if (params.method === 'getAccountInfo') {
        return params.bundle !== undefined
            ? params.bundle.some(accountInfoBatchUsesDevice)
            : accountInfoBatchUsesDevice(params);
    }

    if (params.method === 'thpRemoveCredentials') {
        return params.device !== undefined;
    }

    return !methodsWithoutDevice.includes(params.method);
};
