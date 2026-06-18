import { selectShowConnectLogs } from '@suite/settings';
import { type CreateLogger, initLog } from '@trezor/connect';

type CreateConnectLoggerFactoryDeps = {
    getState: () => any;
};

export type CreateConnectLoggerFactory = (deps: CreateConnectLoggerFactoryDeps) => CreateLogger;

export type CreateConnectLoggerFactoryDep = {
    createConnectLoggerFactory?: CreateConnectLoggerFactory;
};

export const createConnectLoggerFactory: CreateConnectLoggerFactory = ({ getState }) => {
    const enabled = selectShowConnectLogs(getState());

    return prefix => initLog(prefix, enabled);
};
