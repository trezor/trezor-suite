import type { CoreCallMessage } from '@trezor/connect-common';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import type { ModuleName } from '@trezor/connect-common/src/constants/network';
import { MODULES } from '@trezor/connect-common/src/constants/network';

import * as Methods from '../api';
import type { AbstractMethod } from './AbstractMethod';

const getMethodModule = (method: CoreCallMessage['payload']['method']) =>
    MODULES.find(module => method.startsWith(module));

// `authDb` methods live under api/authDbMethods/ (not api/authDb/) to avoid clashing
// with the @trezor/ward package name; every other module's folder still matches its
// MODULES entry, so only this one needs a lookup.
const MODULE_DIRS: Partial<Record<ModuleName, string>> = { authDb: 'authDbMethods' };
const getModuleDir = (module: ModuleName) => MODULE_DIRS[module] ?? module;

export const getMethod = async (message: CoreCallMessage): Promise<AbstractMethod<any>> => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const methodModule = getMethodModule(method);
    const methods = methodModule
        ? await import(
              /* webpackChunkName: "coins/[request]" */ /* @vite-ignore */ `../api/${getModuleDir(methodModule)}/api/index.ts`
          )
        : Methods;
    const MethodConstructor = methods[method];

    if (MethodConstructor) {
        return new MethodConstructor(message);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
