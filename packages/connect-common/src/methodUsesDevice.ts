import { exhaustive } from '@trezor/type-utils';

import { type CallMethodPayload } from './events/call';

type MethodName = CallMethodPayload['method'];

/**
 * Methods whose implementation in `packages/connect-core/src/api` sets `this.useDevice = false`
 * unconditionally. Core short-circuits these without acquiring the device, so a host has no
 * reason to serialize them against device calls.
 *
 * `methodUsesDevice.test.ts` in `@trezor/connect-core` fails if this drifts from the
 * implementations, which is the only thing keeping the two in step.
 */
export const methodsWithoutDevice: readonly MethodName[] = [
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
 * Methods whose implementation derives `useDevice` from the call's params, so no list can answer
 * for them. Adding one here is a compile error until `usesDeviceConditionally` handles it.
 */
export const methodsWithConditionalDevice = [
    'getAccountInfo',
    'thpRemoveCredentials',
] as const satisfies readonly MethodName[];

type ConditionalDeviceMethod = (typeof methodsWithConditionalDevice)[number];

type ConditionalDeviceParams = Extract<CallMethodPayload, { method: ConditionalDeviceMethod }>;

const isConditional = (params: CallMethodPayload): params is ConditionalDeviceParams =>
    (methodsWithConditionalDevice as readonly MethodName[]).includes(params.method);

// Without a descriptor the xpub has to be derived on the device; with one the call is backend-only.
const accountInfoBatchUsesDevice = (batch: { path?: string; descriptor?: string }) =>
    batch.path !== undefined && typeof batch.descriptor !== 'string';

const usesDeviceConditionally = (params: ConditionalDeviceParams): boolean => {
    switch (params.method) {
        case 'getAccountInfo':
            // A bundle needs the device when any of its batches does.
            return params.bundle !== undefined
                ? params.bundle.some(accountInfoBatchUsesDevice)
                : accountInfoBatchUsesDevice(params);
        case 'thpRemoveCredentials':
            // Credentials are removed from the device only when one is addressed.
            return params.device !== undefined;
        default:
            return exhaustive(params, 'Unhandled conditional device method');
    }
};

/**
 * Whether a call needs the physical device, matching what `@trezor/connect-core` will decide for
 * the same params. Hosts use it to serialize device calls — `Device.run` rejects overlapping ones
 * with `Device_CallInProgress` rather than queueing them — and to reflect "device busy" in their UI.
 */
export const methodUsesDevice = (params: CallMethodPayload): boolean =>
    isConditional(params)
        ? usesDeviceConditionally(params)
        : !methodsWithoutDevice.includes(params.method);
