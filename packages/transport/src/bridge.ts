import type { AbstractTransportParams } from '@trezor/transport-abstract';

import { BridgeTransport } from './transports/bridge';

/**
 * Bridge listens on two HTTP ports — `21328` (node-bridge) and the default
 * `21325` (trezord-go). Suite-side composition typically wants both
 * connections active so it works with either implementation.
 *
 * `id` is optional and defaults to `'bridge'`; protobuf messages are now
 * loaded internally by `BridgeTransport`, so most call sites can pass nothing.
 */
export const createBridgeTransports = (
    params: Omit<AbstractTransportParams, 'id'> & { id?: string } = {},
): BridgeTransport[] => {
    const fullParams = { id: 'bridge', ...params };

    return [new BridgeTransport({ ...fullParams, port: 21328 }), new BridgeTransport(fullParams)];
};
