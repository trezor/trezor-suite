import { selectShowConnectLogs } from '@suite/settings';
import { initLog } from '@trezor/connect';
import type { CreateLogger } from '@trezor/logger';

type CreateConnectLoggerFactoryDeps = {
    getState: () => any;
};

type ConnectLoggerFactory = CreateLogger;

export const createConnectLoggerFactory =
    (deps: CreateConnectLoggerFactoryDeps): ConnectLoggerFactory =>
    prefix =>
        initLog(prefix, selectShowConnectLogs(deps.getState()));
