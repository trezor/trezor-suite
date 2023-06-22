// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/debug.js
/* eslint-disable no-console */

const colors: Record<string, string> = {
    // orange, api related
    '@trezor/connect': 'color: #f4a742; background: #000;',
    IFrame: 'color: #f4a742; background: #000;',
    Core: 'color: #f4a742; background: #000;',
    // green, device related
    DescriptorStream: 'color: #77ab59; background: #000;',
    DeviceList: 'color: #77ab59; background: #000;',
    Device: 'color: #bada55; background: #000;',
    DeviceCommands: 'color: #bada55; background: #000;',
    '@trezor/transport': 'color: #bada55; background: #000;',
};

type LogMessage = {
    level: string;
    prefix: string;
    message: any[];
    timestamp: number;
};

const MAX_ENTRIES = 100;

class Log {
    prefix: string;
    enabled: boolean;
    css: string;
    messages: LogMessage[];

    constructor(prefix: string, enabled: boolean) {
        this.prefix = prefix;
        this.enabled = enabled;
        this.messages = [];
        this.css = typeof window !== 'undefined' && colors[prefix] ? colors[prefix] : '';
    }

    addMessage(level: string, prefix: string, ...args: any[]) {
        this.messages.push({
            level,
            prefix,
            message: args,
            timestamp: Date.now(),
        });
        if (this.messages.length > MAX_ENTRIES) {
            this.messages.shift();
        }
    }

    log(...args: any[]) {
        this.addMessage('log', this.prefix, ...args);
        if (this.enabled) {
            console.log(this.prefix, ...args);
        }
    }

    error(...args: any[]) {
        this.addMessage('error', this.prefix, ...args);
        if (this.enabled) {
            console.error(this.prefix, ...args);
        }
    }

    warn(...args: any[]) {
        this.addMessage('warn', this.prefix, ...args);
        if (this.enabled) {
            console.warn(this.prefix, ...args);
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

export const initLog = (prefix: string, enabled?: boolean) => {
    const instance = new Log(prefix, !!enabled);
    _logs[prefix] = instance;
    return instance;
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
