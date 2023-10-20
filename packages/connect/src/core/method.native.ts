/* eslint-disable global-require */
import * as Methods from '../api';
import { TypedError } from '../constants/errors';
import { ModuleName, MODULES } from '../constants/network';
import type { IFrameCallMessage } from '../events';

const moduleMethods = {
    binance: require('../api/binance/api'),
    cardano: require('../api/cardano/api'),
    eos: require('../api/eos/api'),
    ethereum: require('../api/ethereum/api'),
    nem: require('../api/nem/api'),
    ripple: require('../api/ripple/api'),
    solana: require('../api/solana/api'),
    stellar: require('../api/stellar/api'),
    tezos: require('../api/tezos/api'),
} as const satisfies Record<ModuleName, any>;

const getMethodModule = (method: IFrameCallMessage['payload']['method']) =>
    MODULES.find(module => method.startsWith(module));

// eslint-disable-next-line require-await
export const getMethod = async (message: IFrameCallMessage & { id?: number }) => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const methodModule = getMethodModule(method);
    const methods = methodModule ? moduleMethods[methodModule] : Methods;
    const MethodConstructor = methods[method];

    if (MethodConstructor) {
        return new MethodConstructor(message as any);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
