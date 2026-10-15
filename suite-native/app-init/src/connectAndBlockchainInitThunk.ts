import { type SerializedError } from '@reduxjs/toolkit';

import { type Result, err, ok } from '@trezor/type-utils';

export type ConnectAndBlockchainInitDeps = {
    connectInit: () => Promise<Result<void, SerializedError>>;
    initBlockchain: () => Promise<Result<void, SerializedError>>;
    logError: (message: string) => void;
};

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
        const connectResult = await deps.connectInit();

        if (!connectResult.success) {
            deps.logError(`Connect init error: ${JSON.stringify(connectResult.error)}`);

            return err<ConnectAndBlockchainInitError>({
                type: 'ConnectInitError',
                error: connectResult.error,
            });
        }

        const blockchainResult = await deps.initBlockchain();

        if (!blockchainResult.success) {
            deps.logError(`Blockchain init error: ${JSON.stringify(blockchainResult.error)}`);

            return err<ConnectAndBlockchainInitError>({
                type: 'BlockchainInitError',
                error: blockchainResult.error,
            });
        }

        return ok();
    };
