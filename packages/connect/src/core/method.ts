import { TypedError } from '@trezor/connect-common/src/constants/errors';

import * as Methods from '../api';
import { MODULES } from '../constants/network';
import type { CoreCallMessage } from '../events';
import type { AbstractMethod } from './AbstractMethod';

const getMethodModule = (method: CoreCallMessage['payload']['method']) =>
    MODULES.find(module => method.startsWith(module));

export const getMethod = async (message: CoreCallMessage): Promise<AbstractMethod<any>> => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const methodModule = getMethodModule(method);
    const methods = methodModule
        ? await import(
              /* webpackChunkName: "[request]" */ /* @vite-ignore */ `../api/${methodModule}/api/index.ts`
          )
        : Methods;
    const MethodConstructor = methods[method];

    if (MethodConstructor) {
        return new MethodConstructor(message);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
