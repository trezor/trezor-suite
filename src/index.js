/* @flow */

import {
    createInstance,
    getInstance
} from './workers/blockchain';

export default {
    create: createInstance,
    get: getInstance,
    remove: null // TODO: remove instance (disconnect clear ect.)
};

export { Blockchain } from './workers/blockchain';

export type {
    Blockbook,
    Ripple
} from './types';