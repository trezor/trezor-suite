import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';
import type { ChainSendDevice } from '@trezor/network-module-suite-common-types';

/** Connect for the networks' send implementations the Redux thunks delegate to. */
export const chainSendConnectDeps = { getTrezorConnect: () => TrezorConnect };

/** The device a transaction is signed on, as Connect identifies it. */
export const toChainSendDevice = (device: TrezorDevice): ChainSendDevice => ({
    path: device.path,
    instance: device.instance,
    state: device.state,
    useEmptyPassphrase: device.useEmptyPassphrase,
});
