import { connectInitThunk } from '@suite-common/connect-init';
import { initBlockchainThunk } from '@suite-common/wallet-core';
import { type DispatchDep } from '@trezor/redux-utils';

import {
    type ConnectAndBlockchainInitializationResult,
    ConnectAndBlockchainInitializationStatus,
} from './appTypes';

export type ConnectAndBlockchainInitDeps = DispatchDep;

export type ConnectAndBlockchainInit = () => Promise<ConnectAndBlockchainInitializationResult>;

export type ConnectAndBlockchainInitDep = {
    connectAndBlockchainInit: ConnectAndBlockchainInit;
};

export const createConnectAndBlockchainInit =
    (deps: ConnectAndBlockchainInitDeps): ConnectAndBlockchainInit =>
    async () => {
        try {
            const connectResult = await deps.dispatch(connectInitThunk());

            if (connectInitThunk.rejected.match(connectResult)) {
                console.error(`Connect init error: ${JSON.stringify(connectResult.error)}`);

                return ConnectAndBlockchainInitializationStatus.Unavailable;
            }

            const blockchainResult = await deps.dispatch(initBlockchainThunk());

            if (initBlockchainThunk.rejected.match(blockchainResult)) {
                console.error(`Blockchain init error: ${JSON.stringify(blockchainResult.error)}`);

                return ConnectAndBlockchainInitializationStatus.Unavailable;
            }
        } catch {
            // The thunk also returned a rejected result for unexpected errors.
            return ConnectAndBlockchainInitializationStatus.Unavailable;
        }

        return ConnectAndBlockchainInitializationStatus.Ready;
    };
