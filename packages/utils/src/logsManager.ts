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
        Object.keys(this.logs).forEach(key => {
            const log = this.logs[key];
            if (!log) return;
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
        Object.keys(this.logs).forEach(key => {
            const log = this.logs[key];
            if (log) {
                log.enabled = !!enabled;
            }
        });
    }

    enableLogByPrefix(prefix: string, enabled: boolean) {
        if (this.logs[prefix]) {
            this.logs[prefix].enabled = enabled;
        }
    }

    getLog() {
        let logs: LogMessage[] = [];
        Object.keys(this.logs).forEach(key => {
            const log = this.logs[key];
            if (log) {
                logs = logs.concat(log.messages);
            }
        });
        logs.sort((a, b) => a.timestamp - b.timestamp);

        return logs;
    }
}
