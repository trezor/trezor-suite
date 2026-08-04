// input checks for high-level transports

import * as ERRORS from '../errors';
import type { Descriptor, Session } from '../types';
import { validateProtocolMessage } from './bridgeProtocolMessage';
import { error, success } from './result';

type UnknownPayload = string | Record<string, unknown>;

function isString(payload: UnknownPayload): payload is string {
    return typeof payload === 'string';
}

export function info(res: UnknownPayload) {
    if (isString(res)) {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }
    const { version } = res;
    if (typeof version !== 'string') {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }

    return success({ version });
}

export function devices(res: UnknownPayload) {
    if (isString(res)) {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }
    if (!(res instanceof Array)) {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
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
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }

    return success(
        res.map((o): Descriptor => {
            const d = o as Record<string, unknown>;

            return {
                path: d.path,
                session: d.session,
                sessionOwner: d.sessionOwner,
                product: d.product,
                type: d.type,
                vendor: d.vendor,
                debug: d.debug,
                debugSession: d.debugSession,
                id: d.id,
                apiType: d.apiType || 'usb', // no other option is implemented at this moment
                model: d.model,
            } as unknown as Descriptor;
        }),
    );
}

export function acquire(res: UnknownPayload) {
    if (isString(res)) {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }
    const { session } = res;
    if (typeof session !== 'string') {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }

    return success(session as Session);
}

export function call(res: UnknownPayload) {
    try {
        return success(validateProtocolMessage(res, true));
    } catch {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }
}

export function post(res: UnknownPayload) {
    try {
        return success(validateProtocolMessage(res, false));
    } catch {
        return error({ code: ERRORS.WRONG_RESULT_TYPE });
    }
}

export function empty(res: UnknownPayload) {
    return res != null && JSON.stringify(res) === '{}'
        ? error({ code: ERRORS.WRONG_RESULT_TYPE })
        : success(undefined);
}
