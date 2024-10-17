// input checks for high-level transports

import type { Descriptor, Session } from '../types';

import { success, error } from './result';
import { validateProtocolMessage } from './bridgeProtocolMessage';
import * as ERRORS from '../errors';

type UnknownPayload = string | Record<string, unknown>;

function isString(payload: UnknownPayload): payload is string {
    return typeof payload === 'string';
}

export function info(res: UnknownPayload) {
    if (isString(res)) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }
    const { version } = res;
    if (typeof version !== 'string') {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }
    const configured = !!res.configured;
    const protocolMessages = !!res.protocolMessages;

    return success({ version, configured, protocolMessages });
}

export function version(res: UnknownPayload) {
    if (!isString(res)) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }

    return success(res.trim());
}

export function devices(res: UnknownPayload) {
    if (isString(res)) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }
    if (!(res instanceof Array)) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }
    if (
        res.some(
            o =>
                typeof o !== 'object' ||
                !o ||
                typeof o.path !== 'string' ||
                (typeof o.session !== 'string' && o.session !== null),
        )
    ) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }

    return success(
        res.map(
            (o: any): Descriptor => ({
                path: o.path,
                session: o.session,
                sessionOwner: o.sessionOwner,
                product: o.product,
                type: o.type,
                vendor: o.vendor,
                debug: o.debug,
                debugSession: o.debugSession,
            }),
        ),
    );
}

export function acquire(res: UnknownPayload) {
    if (isString(res)) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }
    const { session } = res;
    if (typeof session !== 'string') {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }

    return success(session as Session);
}

export function call(res: UnknownPayload) {
    try {
        return success(validateProtocolMessage(res, true));
    } catch (e) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }
}

export function post(res: UnknownPayload) {
    try {
        return success(validateProtocolMessage(res, false));
    } catch (e) {
        return error({ error: ERRORS.WRONG_RESULT_TYPE });
    }
}

export function empty(res: UnknownPayload) {
    return res != null && JSON.stringify(res) === '{}'
        ? error({ error: ERRORS.WRONG_RESULT_TYPE })
        : success(undefined);
}
