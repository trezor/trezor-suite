import {
    BridgeTransport,
    NodeUsbTransport,
    Transport,
    UdpTransport,
    WebUsbTransport,
    isTransportInstance,
} from '@trezor/transport';
import type { AbstractTransportParams } from '@trezor/transport/src/transports/abstract';

import { ERRORS } from '../constants';
import { ConnectSettingsTransport } from '../types';

type Params = AbstractTransportParams & { sessionsBackgroundUrl?: string | null };

const tryGetTransport = (transports: Transport[], name: string) =>
    transports.find(t => t.name === name);

const getOrCreateTransport = (
    transports: Transport[],
    transportType: ConnectSettingsTransport,
    params: Params,
) => {
    if (typeof transportType === 'string') {
        const existing = tryGetTransport(transports, transportType);
        if (existing) return existing;

        switch (transportType) {
            case 'WebUsbTransport':
                return new WebUsbTransport(params);
            case 'NodeUsbTransport':
                return new NodeUsbTransport(params);
            case 'BridgeTransport':
                return new BridgeTransport(params);
            case 'UdpTransport':
                return new UdpTransport(params);
        }
    } else if (typeof transportType === 'function' && 'prototype' in transportType) {
        const transportInstance = new transportType(params);
        if (isTransportInstance(transportInstance)) {
            return tryGetTransport(transports, transportInstance.name) ?? transportInstance;
        }
    } else if (isTransportInstance(transportType)) {
        if (tryGetTransport(transports, transportType.name)) {
            return transportType;
        }

        // custom Transport might be initialized without messages, update them if so
        if (!transportType.getMessage()) {
            transportType.updateMessages(params.messages);
        }

        return transportType;
    }

    // runtime check
    throw ERRORS.TypedError(
        'Runtime',
        `DeviceList.init: transports[] of unexpected type: ${transportType}`,
    );
};

const createTransports = (
    existing: Transport[],
    transports: ConnectSettingsTransport[] = [],
    params: Params,
) => {
    // BridgeTransport is the ultimate fallback
    const transportTypes = transports?.length ? transports : ['BridgeTransport' as const];

    return transportTypes.map(type => getOrCreateTransport(existing, type, params));
};

export const createTransportList =
    (params: Params) => (existing: Transport[], transports?: ConnectSettingsTransport[]) =>
        createTransports(existing, transports, params);
