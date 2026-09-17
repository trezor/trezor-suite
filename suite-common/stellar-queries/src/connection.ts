import { getSuiteVersion, isDesktop, isNative } from '@trezor/env-utils';
import stellar from '@trezor/network-stellar/runtime';
import type { StellarConnection } from '@trezor/network-stellar/types';

/**
 * One connection per backend url, shared by every Stellar query.
 *
 * It is deliberately not a query of its own: a live connection is not serialisable, so it could
 * never be part of a query key, and the handshake it performs is the same work the worker does once
 * per session. Kept outside the cache, it also survives a query being garbage collected.
 */
const connections = new Map<string, Promise<StellarConnection>>();

const connect = async (url: string) => {
    const { createStellarConnection } = await stellar();

    return createStellarConnection(
        url,
        isDesktop() || isNative() ? `Trezor Suite ${getSuiteVersion()}` : undefined,
    );
};

export const getStellarConnection = (url: string): Promise<StellarConnection> => {
    const existing = connections.get(url);
    if (existing) return existing;

    // A failed handshake must not be remembered, or the backend stays unreachable for the session.
    const connection = connect(url).catch(error => {
        connections.delete(url);
        throw error;
    });
    connections.set(url, connection);

    return connection;
};
