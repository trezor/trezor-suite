// input checks for high-level transports

import type { Descriptor, MessageFromTrezor } from '../types';

const ERROR = 'Wrong result type.';

export function info(res: any) {
    if (typeof res !== 'object' || res == null) {
        throw new Error(ERROR);
    }
    const { version } = res;
    if (typeof version !== 'string') {
        throw new Error(ERROR);
    }
    const configured = !!res.configured;
    return { version, configured };
}

export function version(version: any) {
    if (typeof version !== 'string') {
        throw new Error(ERROR);
    }
    return version.trim();
}

function convertSession(r: any) {
    if (r == null) {
        return null;
    }
    if (typeof r !== 'string') {
        throw new Error(ERROR);
    }
    return r;
}

export function devices(res: any): Descriptor[] {
    if (typeof res !== 'object') {
        throw new Error(ERROR);
    }
    if (!(res instanceof Array)) {
        throw new Error(ERROR);
    }
    return res.map((o: any): Descriptor => {
        if (typeof o !== 'object' || o == null) {
            throw new Error(ERROR);
        }
        const { path } = o;
        if (typeof path !== 'string') {
            throw new Error(ERROR);
        }
        const pathS = path.toString();
        return {
            path: pathS,
            session: convertSession(o.session),
            // @ts-expect-error - this is part of response too, might add it to type later
            product: o.product,
            vendor: o.vendor,
            debug: o.debug,
            debugSession: o.debugSession,
        };
    });
}

export function acquire(res: any) {
    if (typeof res !== 'object' || res == null) {
        throw new Error(ERROR);
    }
    const { session } = res;
    if (typeof session !== 'string' && typeof session !== 'number') {
        throw new Error(ERROR);
    }
    return session.toString();
}

export function call(res: any): MessageFromTrezor {
    if (typeof res !== 'object' || res == null) {
        throw new Error(ERROR);
    }
    const { type } = res;
    if (typeof type !== 'string') {
        throw new Error(ERROR);
    }
    const { message } = res;
    if (typeof message !== 'object' || message == null) {
        throw new Error(ERROR);
    }
    // @ts-expect-error
    // todo: add strong check for MessageType. Now we check only string
    return { type, message };
}
