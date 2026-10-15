import { type SerializedError } from '@reduxjs/toolkit';

import { createMockDeps } from '@trezor/dependency-injection';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    type ConnectAndBlockchainInitDeps,
    createConnectAndBlockchainInit,
} from './connectAndBlockchainInitThunk';

const createDeps = () =>
    createMockDeps<ConnectAndBlockchainInitDeps>({
        connectInit: () => Promise.resolve(ok()),
        initBlockchain: () => Promise.resolve(ok()),
        logError: () => {},
    });

describe(createConnectAndBlockchainInit.name, () => {
    it('initializes blockchain after Connect succeeds', async () => {
        let finishConnect = () => {};
        const connectResult = new Promise<Result<void, SerializedError>>(resolve => {
            finishConnect = () => resolve(ok());
        });
        const deps = createDeps();
        deps.connectInit.mockReturnValue(connectResult);

        const initialization = createConnectAndBlockchainInit(deps)();

        expect(deps.connectInit).toHaveBeenCalledTimes(1);
        expect(deps.initBlockchain).not.toHaveBeenCalled();

        finishConnect();
        const result = await initialization;

        expect(result).toEqual(ok());
        expect(deps.initBlockchain).toHaveBeenCalledTimes(1);
        expect(deps.logError).not.toHaveBeenCalled();
    });

    it('does not initialize blockchain after Connect fails', async () => {
        const error: SerializedError = { message: 'Connect init failed' };
        const deps = createDeps();
        deps.connectInit.mockResolvedValue(err(error));

        const result = await createConnectAndBlockchainInit(deps)();

        expect(result).toEqual(err({ type: 'ConnectInitError', error }));
        expect(deps.initBlockchain).not.toHaveBeenCalled();
        expect(deps.logError).toHaveBeenCalledWith(`Connect init error: ${JSON.stringify(error)}`);
    });

    it('reports blockchain initialization failure', async () => {
        const error: SerializedError = { message: 'Blockchain init failed' };
        const deps = createDeps();
        deps.initBlockchain.mockResolvedValue(err(error));

        const result = await createConnectAndBlockchainInit(deps)();

        expect(result).toEqual(err({ type: 'BlockchainInitError', error }));
        expect(deps.logError).toHaveBeenCalledWith(
            `Blockchain init error: ${JSON.stringify(error)}`,
        );
    });
});
