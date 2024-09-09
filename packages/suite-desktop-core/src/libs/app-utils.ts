import { app } from 'electron';

import { mergeDeepObject } from '@trezor/utils';

export const restartApp = () => {
    const { logger } = global;

    logger.info('app', `Relaunching app with ${process.argv.slice(1).join(', ')} arguments.`);

    const options: Electron.RelaunchOptions = { args: process.argv };
    if (process.env.APPIMAGE) {
        options.execPath = process.env.APPIMAGE;
        options.args = options.args ?? [];
        options.args.unshift('--appimage-extract-and-run');
    }

    app.removeAllListeners('before-quit');
    app.relaunch();
    app.quit();
};

const tryParseJson = (value: any) => {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

export const processStatePatch = () =>
    process.argv
        .filter(arg => /^--state[.=]/.test(arg))
        .map(arg => arg.slice(2).split('=')[0])
        .map(arg => [arg.slice(6), tryParseJson(app.commandLine.getSwitchValue(arg))] as const)
        .map(([key, value]) => (key ? { [key]: value } : value))
        .reduce<Record<string, any> | undefined>(
            (prev, cur) => mergeDeepObject.withOptions({ dotNotation: true }, prev ?? {}, cur),
            undefined,
        );
