import { selectShowConnectLogs } from '@suite/settings';
import { type CreateLogger, initLog } from '@trezor/connect';

type CreateConnectLoggerFactoryDeps = {
    getState: () => any;
};

export type CreateConnectLoggerFactory = (deps: CreateConnectLoggerFactoryDeps) => CreateLogger;

export const createConnectLoggerFactory: CreateConnectLoggerFactory =
    ({ getState }) =>
    prefix =>
        initLog(prefix, selectShowConnectLogs(getState()));
