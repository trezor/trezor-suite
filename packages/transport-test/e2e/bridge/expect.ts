import { DEVICE_TYPE } from '@trezor/transport-common';

import { env } from './controller';

const { USE_HW } = env;

const debug = undefined;
const debugSession = undefined;

const path = expect.any(String);
const product = USE_HW ? 21441 : 0;
const vendor = USE_HW ? 4617 : 0;
const id = expect.any(String);
const apiType = 'usb' as const;
const type = expect.toBeOneOf(Object.values(DEVICE_TYPE));
const model = USE_HW ? expect.any(Number) : undefined;
const sessionOwner = expect.toBeOneOf([expect.any(String), undefined]);

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

export const errorCase1 = USE_HW ? 'device disconnected during action' : 'Network request failed';
