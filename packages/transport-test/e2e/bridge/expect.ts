import { DEVICE_TYPE } from '@trezor/transport/src/constants';

import { env } from './controller';

const { USE_HW, USE_NODE_BRIDGE } = env;

const debug = USE_NODE_BRIDGE ? undefined : !USE_HW;
const debugSession = USE_NODE_BRIDGE ? undefined : null;

const path = USE_NODE_BRIDGE ? expect.any(String) : '1';
const product = USE_HW ? 21441 : 0;
const vendor = USE_HW ? 4617 : 0;
const id = USE_NODE_BRIDGE ? expect.any(String) : undefined;
const apiType = 'usb' as const;
const type = USE_NODE_BRIDGE ? expect.toBeOneOf(Object.values(DEVICE_TYPE)) : undefined;
const model = USE_NODE_BRIDGE && USE_HW ? expect.any(Number) : undefined;
const sessionOwner = USE_NODE_BRIDGE
    ? expect.toBeOneOf([expect.any(String), undefined])
    : undefined;

/**
 * internal path has variable length
 * emu            '127.0.0.1:21324' (15)
 * hw new bridge  '185B982B5F37F9D96706EC49' (24)
 * but it is masked using a growing sequence of numbers starting from 1
 */
export const pathLength = 1;

export const descriptor = {
    debug,
    debugSession,
    path,
    product,
    vendor,
    type,
    id,
    apiType,
    model,
    sessionOwner,
};

export const errorCase1 =
    !USE_NODE_BRIDGE && !USE_HW
        ? 'unexpected error'
        : USE_HW
          ? 'device disconnected during action'
          : 'Network request failed';
