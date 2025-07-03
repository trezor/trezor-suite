import { Log, LogMessage, LogWriter } from './logs';
import { typedObjectKeys } from './typedObjectKeys';

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
        typedObjectKeys(this.logs).forEach(key => {
            this.writer = logWriterFactory();
            if (this.writer) {
                this.logs[key].setWriter(this.writer);
                const { messages } = this.logs[key];
                // If there are any messages in the log when init, add them to the writer.
                messages.forEach(message => {
                    this.writer?.add(message);
                });
            }
        });
    }

    enableLog(enabled?: boolean) {
        typedObjectKeys(this.logs).forEach(key => {
            this.logs[key].enabled = !!enabled;
        });
    }

    enableLogByPrefix(prefix: string, enabled: boolean) {
        if (this.logs[prefix]) {
            this.logs[prefix].enabled = enabled;
        }
    }

    getLog() {
        let logs: LogMessage[] = [];
        typedObjectKeys(this.logs).forEach(key => {
            logs = logs.concat(this.logs[key].messages);
        });
        logs.sort((a, b) => a.timestamp - b.timestamp);

        return logs;
    }
}
