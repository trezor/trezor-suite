// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/debug.js
/* eslint-disable no-console */

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

export type LogMessage = {
    level: string;
    prefix: string;
    message: any[];
    timestamp: number;
};

export type LogWriter = {
    add: (message: LogMessage) => void;
};

const MAX_ENTRIES = 100;

export class Log {
    prefix: string;
    enabled: boolean;
    css: string;
    messages: LogMessage[];
    logWriter: LogWriter | undefined;

    constructor(prefix: string, enabled: boolean, logWriter?: LogWriter) {
        this.prefix = prefix;
        this.enabled = enabled;
        this.messages = [];
        this.css = typeof window !== 'undefined' && colors[prefix] ? colors[prefix] : '';
        if (logWriter) {
            this.logWriter = logWriter;
        }
    }

    addMessage(
        { level, prefix, timestamp }: { level: string; prefix: string; timestamp?: number },
        ...args: any[]
    ) {
        const message = {
            level,
            prefix,
            css: this.css,
            message: args,
            timestamp: timestamp || Date.now(),
        };

        this.messages.push(message);

        if (this.logWriter) {
            try {
                this.logWriter.add(message);
            } catch (err) {
                // If this error happens it probably means that we are logging an object with a circular reference.
                // If there is any `device` logged, do it with `device.toMessageObject()` instead.
                console.error('There was an error adding log message', err, message);
            }
        }
        if (this.messages.length > MAX_ENTRIES) {
            this.messages.shift();
        }
    }

    setWriter(logWriter: any) {
        this.logWriter = logWriter;
    }

    log(...args: any[]) {
        this.addMessage({ level: 'log', prefix: this.prefix }, ...args);
        if (this.enabled) {
            console.log(`%c${this.prefix}`, this.css, ...args);
        }
    }

    error(...args: any[]) {
        this.addMessage({ level: 'error', prefix: this.prefix }, ...args);
        if (this.enabled) {
            console.error(`%c${this.prefix}`, this.css, ...args);
        }
    }

    warn(...args: any[]) {
        this.addMessage({ level: 'warn', prefix: this.prefix }, ...args);
        if (this.enabled) {
            console.warn(`%c${this.prefix}`, this.css, ...args);
        }
    }

    debug(...args: any[]) {
        this.addMessage({ level: 'debug', prefix: this.prefix }, ...args);
        if (this.enabled) {
            if (this.css) {
                console.log(`%c${this.prefix}`, this.css, ...args);
            } else {
                console.log(this.prefix, ...args);
            }
        }
    }
}

const _logs: { [k: string]: Log } = {};
let writer: LogWriter | undefined;

export const initLog = (prefix: string, enabled?: boolean, logWriter?: LogWriter) => {
    const instanceWriter = logWriter || writer;
    const instance = new Log(prefix, !!enabled, instanceWriter);
    _logs[prefix] = instance;
    return instance;
};

export const setLogWriter = (logWriterFactory: () => LogWriter | undefined) => {
    Object.keys(_logs).forEach(key => {
        writer = logWriterFactory();
        if (writer) {
            _logs[key].setWriter(writer);
            const { messages } = _logs[key];
            // If there are any messages in the log when init, add them to the writer.
            messages.forEach(message => {
                writer?.add(message);
            });
        }
    });
};

export const enableLog = (enabled?: boolean) => {
    Object.keys(_logs).forEach(key => {
        _logs[key].enabled = !!enabled;
    });
};

export const enableLogByPrefix = (prefix: string, enabled: boolean) => {
    if (_logs[prefix]) {
        _logs[prefix].enabled = enabled;
    }
};

export const getLog = () => {
    let logs: LogMessage[] = [];
    Object.keys(_logs).forEach(key => {
        logs = logs.concat(_logs[key].messages);
    });
    logs.sort((a, b) => a.timestamp - b.timestamp);
    return logs;
};
