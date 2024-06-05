import { LogsManager } from '@trezor/utils';

const green = '#bada55';
const blue = '#20abd8';
const orange = '#f4a744';
const yellow = '#fbd948';

const colors: Record<string, string> = {
    // blue, npm package related
    '@trezor/connect': `color: ${blue}; background: #000;`,
    '@trezor/connect-web': `color: ${blue}; background: #000;`,
    '@trezor/connect-webextension': `color: ${blue}; background: #000;`,
    // orange, api related
    IFrame: `color: ${orange}; background: #000;`,
    Core: `color: ${orange}; background: #000;`,
    // green, device related
    DeviceList: `color: ${green}; background: #000;`,
    Device: `color: ${green}; background: #000;`,
    DeviceCommands: `color: ${green}; background: #000;`,
    '@trezor/transport': `color: ${green}; background: #000;`,
    InteractionTimeout: `color: ${green}; background: #000;`,
    // yellow, ui related
    '@trezor/connect-popup': `color: ${yellow}; background: #000;`,
};

const logsManager = new LogsManager({ colors });

export const initLog = logsManager.initLog.bind(logsManager);
export const setLogWriter = logsManager.setLogWriter.bind(logsManager);
export const enableLog = logsManager.enableLog.bind(logsManager);
export const enableLogByPrefix = logsManager.enableLogByPrefix.bind(logsManager);
export const getLog = logsManager.getLog.bind(logsManager);

export type { LogMessage, LogWriter, Log } from '@trezor/utils';
