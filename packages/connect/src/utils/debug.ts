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

const stringify = (obj: Record<string, any>) => {
    let cache: string[] = [];
    const str = JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    });
    cache = [];
    return str;
};

class Log {
    prefix: string;
    enabled: boolean;
    css: string;
    messages: LogMessage[];
    logWriter: any;

    constructor(prefix: string, enabled: boolean, logWriter?: LogWriter) {
        this.prefix = prefix;
        this.enabled = enabled;
        this.messages = [];
        this.css = typeof window !== 'undefined' && colors[prefix] ? colors[prefix] : '';
        if (logWriter) {
            this.logWriter = logWriter;
        }
    }

    addMessage(level: string, prefix: string, ...args: any[]) {
        const message = {
            level,
            prefix,
            css: this.css,
            message: args,
            timestamp: Date.now(),
        };

        if (this.logWriter) {
            const { level, prefix, timestamp, ...rest } = message;

            // todo: this method calls post postMessage which serializes object passed in ...args.
            // if there is cyclic dependency, it simply dies.
            // this is probably not the right place to call stringify.
            // on the other hand, catching here is probably the right place to do to make sure that
            // this not-essential mechanism does not break everything when broken.
            try {
                this.logWriter.add({
                    level,
                    prefix,
                    timestamp,
                    message: JSON.parse(stringify(rest)),
                });
            } catch (err) {
                // If this error happens it probably means that we are logging an object with a circular reference.
                // If there is any `device` logged, do it with `device.toMessageObject()` instead.
                // TODO: maybe we should shout out this error to make sure we do not pass circular references to the log.
                console.error('There was an error adding log message', err);
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
        this.addMessage('log', this.prefix, ...args);
        if (this.enabled) {
            console.log(`%c${this.prefix}`, this.css, ...args);
        }
    }

    error(...args: any[]) {
        this.addMessage('error', this.prefix, ...args);
        if (this.enabled) {
            console.error(`%c${this.prefix}`, this.css, ...args);
        }
    }

    warn(...args: any[]) {
        this.addMessage('warn', this.prefix, ...args);
        if (this.enabled) {
            console.warn(`%c${this.prefix}`, this.css, ...args);
        }
    }

    debug(...args: any[]) {
        this.addMessage('debug', this.prefix, ...args);
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
let writer: any;

export const initLog = (prefix: string, enabled?: boolean, logWriter?: LogWriter) => {
    const finalWriter = logWriter || writer;
    const instance = new Log(prefix, !!enabled, finalWriter);
    _logs[prefix] = instance;
    return instance;
};

export const setLogWriter = (logWriter: any) => {
    Object.keys(_logs).forEach(key => {
        writer = logWriter();
        _logs[key].setWriter(writer);
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

export const initSharedLogger = (connectSrc: string) => {
    const workerUrl = `${connectSrc}workers/shared-logger-worker.js`;
    const worker = new SharedWorker(workerUrl);
    worker.port.start();
    const logWriterFactory = (): LogWriter => ({
        add: (message: LogMessage) =>
            worker.port.postMessage({ type: 'add-log', data: JSON.parse(JSON.stringify(message)) }),
    });
    setLogWriter(logWriterFactory);
};
