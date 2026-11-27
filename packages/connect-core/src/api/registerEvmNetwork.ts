import type { PermissionRequest } from '@trezor/connect-common';
import { Assert, Type } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { type RegisterEthereumNetworkParams, registerEthereumNetwork } from '../data/coinInfo';

const RegisterEvmNetworkPayload = Type.Object({
    symbol: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1 }),
    chainId: Type.Integer({ minimum: 1 }),
});

/** Lets the device methods resolve an EVM network added at runtime. Its backend is not Connect's. */
export default class RegisterEvmNetwork extends AbstractMethod<
    'registerEvmNetwork',
    RegisterEthereumNetworkParams
> {
    constructor(message: MethodMessage<'registerEvmNetwork'>) {
        const { payload } = message;

        Assert(RegisterEvmNetworkPayload, payload);

        const { symbol, name, chainId } = payload;

        super(message, { symbol, name, chainId });
        this.useDevice = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    get info() {
        return 'Register EVM network';
    }

    run() {
        registerEthereumNetwork(this.params);

        return Promise.resolve({ symbol: this.params.symbol });
    }
}
