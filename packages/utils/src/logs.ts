export type LogMessage = {
    level: string;
    prefix: string;
    message: any[];
    timestamp: number;
};

export type LogWriter = {
    add: (message: LogMessage) => void;
};

export class Log {
    prefix: string;
    enabled: boolean;
    css: string = '';
    messages: LogMessage[];
    logWriter: LogWriter | undefined;
    MAX_ENTRIES = 100;

    constructor(prefix: string, enabled: boolean, logWriter?: LogWriter) {
        this.prefix = prefix;
        this.enabled = enabled;
        this.messages = [];
        if (logWriter) {
            this.logWriter = logWriter;
        }
    }

    setColors(colors: Record<string, string>) {
        this.css = typeof window !== 'undefined' && colors[this.prefix] ? colors[this.prefix] : '';
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
        if (this.messages.length > this.MAX_ENTRIES) {
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

    info(...args: any[]) {
        this.addMessage({ level: 'info', prefix: this.prefix }, ...args);
        if (this.enabled) {
            console.info(`%c${this.prefix}`, this.css, ...args);
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

    getLog() {
        return this.messages;
    }
}
