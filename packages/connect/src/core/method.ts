import * as Methods from '../api';
import { TypedError } from '../constants/errors';
import { MODULES } from '../constants/network';
import type { IFrameCallMessage } from '../events';
import type { AbstractMethod } from './AbstractMethod';

const getMethodModule = (method: IFrameCallMessage['payload']['method']) =>
    MODULES.find(module => method.startsWith(module));

const importMethodModule = async (methodModule: ReturnType<typeof getMethodModule>) => {
    switch (methodModule) {
        case 'binance':
            return await import(/* webpackChunkName: "[request]" */ `../api/binance/api`);
        case 'cardano':
            return await import(/* webpackChunkName: "[request]" */ `../api/cardano/api`);
        case 'eos':
            return await import(/* webpackChunkName: "[request]" */ `../api/eos/api`);
        case 'ethereum':
            return await import(/* webpackChunkName: "[request]" */ `../api/ethereum/api`);
        case 'nem':
            return await import(/* webpackChunkName: "[request]" */ `../api/nem/api`);
        case 'ripple':
            return await import(/* webpackChunkName: "[request]" */ `../api/ripple/api`);
        case 'solana':
            return await import(/* webpackChunkName: "[request]" */ `../api/solana/api`);
        case 'stellar':
            return await import(/* webpackChunkName: "[request]" */ `../api/stellar/api`);
        case 'tezos':
            return await import(/* webpackChunkName: "[request]" */ `../api/tezos/api`);
        default:
            return Methods;
    }
};

export const getMethod = async (message: IFrameCallMessage): Promise<AbstractMethod<any>> => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const methodModule = getMethodModule(method);
    const methods = await importMethodModule(methodModule);

    // @ts-expect-error: obviously, types won't work here properly
    const MethodConstructor = methods[method];

    if (MethodConstructor) {
        return new MethodConstructor(message);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
