import { selectShowConnectLogs } from '@suite/settings';
import { initLog } from '@trezor/connect';
import type { CreateLogger } from '@trezor/logger';

type CreateConnectLoggerFactoryDeps = {
    getState: () => any;
};

export type CreateConnectLoggerFactory = (deps: CreateConnectLoggerFactoryDeps) => CreateLogger;

export const createConnectLoggerFactory: CreateConnectLoggerFactory =
    ({ getState }) =>
    prefix =>
        initLog(prefix, selectShowConnectLogs(getState()));
