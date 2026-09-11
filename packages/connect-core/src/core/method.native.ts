import type { CoreCallMessage } from '@trezor/connect-common';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import type { ModuleName } from '@trezor/connect-common/src/constants/network';
import { MODULES } from '@trezor/connect-common/src/constants/network';

import * as Methods from '../api';

const moduleMethods = {
    cardano: require('../api/cardano/api'),
    ethereum: require('../api/ethereum/api'),
    monero: require('../api/monero/api'),
    ripple: require('../api/ripple/api'),
    solana: require('../api/solana/api'),
    stellar: require('../api/stellar/api'),
    tezos: require('../api/tezos/api'),
    tron: require('../api/tron/api'),
} as const satisfies Record<ModuleName, any>;

const getMethodModule = (method: CoreCallMessage['payload']['method']) =>
    MODULES.find(module => method.startsWith(module));

// eslint-disable-next-line require-await
export const getMethod = async (message: CoreCallMessage) => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const methodModule = getMethodModule(method);
    const methods = methodModule ? moduleMethods[methodModule] : Methods;
    const MethodConstructor = methods[method];

    if (MethodConstructor) {
        return new MethodConstructor(message);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
