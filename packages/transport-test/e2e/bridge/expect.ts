import { DEVICE_TYPE } from '@trezor/transport/src/api/abstract';

import { env } from './controller';

const { USE_HW, USE_NODE_BRIDGE } = env;

const debug = USE_NODE_BRIDGE ? undefined : USE_HW ? false : true;
const debugSession = USE_NODE_BRIDGE ? undefined : null;
const path = USE_NODE_BRIDGE ? expect.any(String) : '1';
const product = USE_HW ? 21441 : USE_NODE_BRIDGE ? undefined : 0;
const vendor = USE_NODE_BRIDGE ? undefined : USE_HW ? 4617 : 0;
const type =
    USE_NODE_BRIDGE && USE_HW
        ? expect.any(Number)
        : USE_NODE_BRIDGE && !USE_HW
          ? DEVICE_TYPE.TypeEmulator
          : undefined;

/**
 * emu            '127.0.0.1:21324' (15)
 * hw old bridge  '1' (1)
 * hw new bridge  '185B982B5F37F9D96706EC49' (24)
 */
export const pathLength = USE_HW && USE_NODE_BRIDGE ? 24 : !USE_HW && USE_NODE_BRIDGE ? 15 : 1;

export const descriptor = { debug, debugSession, path, product, vendor, type };

export const errorCase1 =
    (USE_NODE_BRIDGE && USE_HW) || (!USE_NODE_BRIDGE && !USE_HW)
        ? 'unexpected error'
        : USE_HW
          ? 'device disconnected during action'
          : 'Network request failed';
