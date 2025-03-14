import fs from 'fs';
import path from 'path';

import { mergeDeepObject } from '@trezor/utils';

import { app } from '../typed-electron';

export const restartApp = () => {
    const { logger } = global;

    logger.info('app', `Relaunching app with ${process.argv.slice(1).join(', ')} arguments.`);

    const options: Electron.RelaunchOptions = { args: process.argv ?? [] };
    if (process.env.APPIMAGE) {
        options.execPath = process.env.APPIMAGE;
        options.args?.unshift('--appimage-extract-and-run');
    }

    // If in daemon/autostart mode, add a flag to show the UI right after restart
    if (app.getLoginItemSettings().openAtLogin) {
        options.args?.push('--bridge-daemon');
    }
    if (options.args?.includes('--bridge-daemon')) {
        options.args?.push('--bridge-daemon-show-ui');
        // In daemon mode, first quit call only hides the app
        app.quit();
    }

    app.relaunch(options);
    app.quit();
};

const tryParseJson = (value: string) => {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const STATE_ASSIGNMENT_REGEX = /^--(state[^=]*)=(.+)$/;
type ProcessStatePatchResult = Record<string, any> | undefined;

/**
 * Get all state patches from process args and parse them to return an aggregated state object patch
 */
export const processStatePatch = (): ProcessStatePatchResult =>
    process.argv
        .map(arg => arg.match(STATE_ASSIGNMENT_REGEX))
        .filter(match => match !== null)
        .map((assignment: RegExpMatchArray) => {
            const [_, key, value] = assignment;

            return { [key]: tryParseJson(value) };
        })
        .reduce<ProcessStatePatchResult>(
            (prev, cur) => mergeDeepObject.withOptions({ dotNotation: true }, prev ?? {}, cur),
            undefined,
        )?.state;

export const removeElectronAppData = () => {
    const localDataDir = app.getPath('userData');
    const filesToDelete = fs.readdirSync(localDataDir);
    filesToDelete.forEach(file => {
        // omitting Cache folder it sometimes prevents the deletion and is not necessary to delete for test idempotency
        if (file !== 'Cache') {
            try {
                fs.rmSync(path.join(localDataDir, file), { recursive: true });
            } catch {
                // If files does not exist do nothing.
            }
        }
    });
};
