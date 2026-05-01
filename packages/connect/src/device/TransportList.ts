import { ERRORS } from '@trezor/connect-common/src/constants';
import type { ConnectSettingsTransport } from '@trezor/connect-common/src/types/settings';
import type { Transport } from '@trezor/transport';
import { isTransportInstance } from '@trezor/transport';
import type { AbstractTransportParams } from '@trezor/transport/src/transports/abstract';

type Params = AbstractTransportParams & { sessionsBackgroundUrl?: string | null };

const tryGetTransport = (transports: Transport[], name: string) =>
    transports.find(t => t.name === name);

const getOrCreateTransport = (
    transports: Transport[],
    transportType: ConnectSettingsTransport,
    params: Params,
): Transport => {
    if (typeof transportType === 'function' && 'prototype' in transportType) {
        const transportInstance = new transportType(params);
        if (isTransportInstance(transportInstance)) {
            return tryGetTransport(transports, transportInstance.name) ?? transportInstance;
        }
    } else if (isTransportInstance(transportType)) {
        const existing = tryGetTransport(transports, transportType.name);
        if (existing) {
            return existing;
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
) => transports.map(type => getOrCreateTransport(existing, type, params));

export const createTransportList =
    (params: Params) => (existing: Transport[], transports?: ConnectSettingsTransport[]) =>
        createTransports(existing, transports, params);
