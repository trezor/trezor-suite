/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { app } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';
import { ensureDirectoryExists } from '@trezor/node-utils';

import { getBuildInfo, getComputerInfo } from './info';

const logLevels = ['mute', 'error', 'warn', 'info', 'debug'] as const;

export type LogLevel = (typeof logLevels)[number];
const isLogLevel = (level: string): level is LogLevel =>
    !!level && logLevels.includes(level as LogLevel);

export type Options = {
    colors: boolean; // Console output has colors
    writeToConsole: boolean; // Output is displayed in the console
    writeToDisk: boolean; // Output is written to a file
    outputFile: string; // file name for the output
    outputPath: string; // path for the output
    logFormat: string; // Output format of the log
    dedupeTimeout: number; // After how many ms are the same messages deduplicated
};

const logLevelSwitchValue = app?.commandLine.getSwitchValue('log-level');
const logLevelByEnv = isDevEnv ? 'debug' : 'error';
const logLevelDefault = isLogLevel(logLevelSwitchValue) ? logLevelSwitchValue : logLevelByEnv;

type LogMessage = {
    date: Date;
    level: LogLevel;
    topic: string;
    text: string;
};

type RepeatedLogMessage = LogMessage & {
    repetition?: number;
};

export class Logger implements ILogger {
    static instance: Logger;
    private stream?: Promise<fs.WriteStream | undefined>;
    private defaultOptions: Options;
    private options: Options;
    private logLevel = 0;

    constructor(level?: LogLevel, options?: Partial<Options>) {
        const logLevel = level || logLevelDefault;

        this.logLevel = logLevels.indexOf(logLevel);

        const userDataDir = app?.getPath('userData');

        this.defaultOptions = {
            colors: true,
            writeToConsole: !app?.commandLine.hasSwitch('log-no-print'),
            writeToDisk: app?.commandLine.hasSwitch('log-write'),
            outputFile: app?.commandLine.getSwitchValue('log-file') || 'trezor-suite-log-%tt.txt',
            outputPath:
                app?.commandLine.getSwitchValue('log-path') ||
                (userDataDir ? `${userDataDir}/logs` : process.cwd()),
            logFormat: '%dt - %lvl(%top): %rep%msg',
            dedupeTimeout: 500,
        };

        this.options = {
            ...this.defaultOptions,
            ...options,
        };

        this.stream = this.prepareWriteStream(this.options);
    }

    private async prepareWriteStream({ writeToDisk, outputFile, outputPath }: Options) {
        if (this.logLevel > 0 && writeToDisk) {
            const stream = await this.stream;
            if (stream !== undefined) {
                // Do not create a new file if there is one currently open.
                return stream;
            }

            if (!outputFile) {
                this.error(
                    'logger',
                    `Can't write log to file because outputFile is not properly set (${outputFile})`,
                );

                return;
            }

            if (!outputPath) {
                this.error(
                    'logger',
                    `Can't write log to file because outputPath is not properly set (${outputPath})`,
                );

                return;
            }

            await ensureDirectoryExists(outputPath);

            return fs.createWriteStream(path.join(outputPath, this.format(outputFile)));
        }
        this.exit();
    }

    private async logBasicInfo() {
        const buildInfo = getBuildInfo();
        this.info('build', buildInfo);

        const computerInfo = await getComputerInfo();
        this.debug('computer', computerInfo);
    }

    private log(level: LogLevel, topic: string, message: string | string[]) {
        const { writeToConsole, writeToDisk, logFormat } = this.options;

        if ((!writeToConsole && !writeToDisk) || !logFormat) {
            return;
        }

        const logLevel = logLevels.indexOf(level);
        if (this.logLevel < logLevel) {
            return;
        }

        const date = new Date();
        const messages: string[] = typeof message === 'string' ? [message] : message;
        messages.forEach(text => this.handleMessage({ level, topic, text, date }));
    }

    private dedupeMessage?: RepeatedLogMessage;
    private dedupeTimeout?: ReturnType<typeof setTimeout>;

    private handleMessage(message: LogMessage) {
        if (!this.options.dedupeTimeout) {
            return this.write(message);
        }

        if (this.dedupeMessage) {
            if (
                this.dedupeMessage.level === message.level &&
                this.dedupeMessage.topic === message.topic &&
                this.dedupeMessage.text === message.text
            ) {
                this.dedupeMessage = {
                    ...message,
                    repetition: (this.dedupeMessage.repetition ?? 1) + 1,
                };
            } else {
                this.write(this.dedupeMessage);
                this.dedupeMessage = message;
            }
        } else {
            this.dedupeMessage = message;
        }

        clearTimeout(this.dedupeTimeout);
        this.dedupeTimeout = setTimeout(() => {
            if (this.dedupeMessage) {
                this.write(this.dedupeMessage);
                this.dedupeMessage = undefined;
            }
        }, this.options.dedupeTimeout);
    }

    private async write({ date, level, topic, text, repetition }: RepeatedLogMessage) {
        const message = this.format(this.options.logFormat, date, {
            lvl: level.toUpperCase(),
            top: topic,
            msg: text,
            rep: (repetition ?? 0) > 1 ? `(${repetition}x) ` : '',
        });

        if (this.options.writeToConsole) {
            console.log(this.options.colors ? this.color(level, message) : message);
        }

        const stream = await this.stream;
        if (stream !== undefined) {
            stream.write(`${message}\n`);
        }
    }

    private format(
        format: string,
        date: Date = new Date(),
        strings: { [key: string]: string } = {},
    ) {
        const params = {
            dt: date.toISOString(),
            ts: (+date).toString(),
            tt: date.toISOString().split('.')[0].replace(/:/g, '-'),
            ...strings,
        };

        return Object.entries(params).reduce(
            (message, [key, val]) => message.replace(`%${key}`, val),
            format,
        );
    }

    private color(level: LogLevel, message: string) {
        switch (level) {
            case 'error':
                return chalk.red(message.replace('ERROR', chalk.bold('ERROR')));
            case 'warn':
                return message.replace('WARN', chalk.bold.yellow('WARN'));
            case 'info':
                return message.replace('INFO', chalk.bold.blue('INFO'));
            case 'debug':
                return message.replace('DEBUG', chalk.bold.cyan('DEBUG'));
            default:
                return message;
        }
    }

    public async exit() {
        if (this.dedupeMessage) {
            this.write(this.dedupeMessage);
            this.dedupeMessage = undefined;
        }

        const stream = await this.stream;
        if (stream !== undefined) {
            stream.end();
        }
    }

    public error(topic: string, message: string | string[]) {
        this.log('error', topic, message);
    }

    public warn(topic: string, message: string | string[]) {
        this.log('warn', topic, message);
    }

    public info(topic: string, message: string | string[]) {
        this.log('info', topic, message);
    }

    public debug(topic: string, message: string | string[]) {
        this.log('debug', topic, message);
    }

    public get level() {
        return logLevels[this.logLevel];
    }

    public set level(level: LogLevel) {
        this.logLevel = logLevels.indexOf(isLogLevel(level) ? level : logLevelDefault);
    }

    public get config() {
        return this.options;
    }

    public set config(options: Partial<Options>) {
        if (options) {
            this.options = {
                ...this.options,
                ...options,
            };
        } else {
            this.options = this.defaultOptions;
        }

        this.stream = this.prepareWriteStream(this.options);

        if (options?.writeToDisk) {
            this.logBasicInfo();
        }
    }
}
