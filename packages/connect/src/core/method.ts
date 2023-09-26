import * as Methods from '../api';
import { TypedError } from '../constants/errors';
import type { IFrameCallMessage } from '../events';

const MODULES = ['binance', 'ripple', 'tezos'] as const;

const getMethodModule = (method: IFrameCallMessage['payload']['method']) =>
    MODULES.find(module => method.startsWith(module));

export const getMethod = async (message: IFrameCallMessage & { id?: number }) => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const methodModule = getMethodModule(method);
    const methods = methodModule
        ? await import(/* webpackChunkName: "[request]" */ `../api/${methodModule}/api`)
        : Methods;
    const MethodConstructor = methods[method];

    if (MethodConstructor) {
        return new MethodConstructor(message as any);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
