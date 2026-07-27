import { Log, type LogMessage, type LogWriter } from './logs';

export class LogsManager {
    logs: { [k: string]: Log } = {};
    writer: LogWriter | undefined;
    colors?: Record<string, string> = {};
    constructor({ colors }: { colors?: Record<string, string> }) {
        this.colors = colors;
    }

    initLog(prefix: string, enabled?: boolean, logWriter?: LogWriter) {
        const instanceWriter = logWriter || this.writer;
        const instance = new Log(prefix, !!enabled, instanceWriter);
        if (this.colors) {
            instance.setColors(this.colors);
        }
        this.logs[prefix] = instance;

        return instance;
    }

    setLogWriter(logWriterFactory: () => LogWriter | undefined) {
        const { logs } = this;
        Object.keys(logs).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const log: Log = logs[key];
            this.writer = logWriterFactory();
            if (this.writer) {
                log.setWriter(this.writer);
                const { messages } = log;
                // If there are any messages in the log when init, add them to the writer.
                messages.forEach(message => {
                    this.writer?.add(message);
                });
            }
        });
    }

    enableLog(enabled?: boolean) {
        const { logs } = this;
        Object.keys(logs).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const log: Log = logs[key];
            log.enabled = !!enabled;
        });
    }

    enableLogByPrefix(prefix: string, enabled: boolean) {
        if (this.logs[prefix]) {
            const { logs } = this;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const log: Log = logs[prefix];
            log.enabled = enabled;
        }
    }

    getLog() {
        let logs: LogMessage[] = [];
        const ownLogs = this.logs;
        Object.keys(ownLogs).forEach(key => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const log: Log = ownLogs[key];
            logs = logs.concat(log.messages);
        });
        logs.sort((a, b) => a.timestamp - b.timestamp);

        return logs;
    }
}
