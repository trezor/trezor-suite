import { type SerializedError } from '@reduxjs/toolkit';

import { connectInitThunk } from '@suite-common/connect-init';
import { initBlockchainThunk } from '@suite-common/wallet-core';
import { type DispatchDep } from '@trezor/redux-utils';
import { type Result, err, ok } from '@trezor/type-utils';

export type ConnectAndBlockchainInitDeps = DispatchDep;

export type ConnectAndBlockchainInitError =
    | { type: 'ConnectInitError'; error: SerializedError }
    | { type: 'BlockchainInitError'; error: SerializedError };

export type ConnectAndBlockchainInit = () => Promise<Result<void, ConnectAndBlockchainInitError>>;

export type ConnectAndBlockchainInitDep = {
    connectAndBlockchainInit: ConnectAndBlockchainInit;
};

export const createConnectAndBlockchainInit =
    (deps: ConnectAndBlockchainInitDeps): ConnectAndBlockchainInit =>
    async () => {
        const connectResult = await deps.dispatch(connectInitThunk());

        if (connectInitThunk.rejected.match(connectResult)) {
            console.error(`Connect init error: ${JSON.stringify(connectResult.error)}`);

            return err<ConnectAndBlockchainInitError>({
                type: 'ConnectInitError',
                error: connectResult.error,
            });
        }

        const blockchainResult = await deps.dispatch(initBlockchainThunk());

        if (initBlockchainThunk.rejected.match(blockchainResult)) {
            console.error(`Blockchain init error: ${JSON.stringify(blockchainResult.error)}`);

            return err<ConnectAndBlockchainInitError>({
                type: 'BlockchainInitError',
                error: blockchainResult.error,
            });
        }

        return ok();
    };
