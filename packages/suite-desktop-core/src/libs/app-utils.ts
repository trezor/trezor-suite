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

/**
 * Parse each statePatch arg, which may be either a JSON, or a key value pair as [dot.notation.path: value]
 */
const parseAssignment = (assignment: string) => {
    const keyValuePair = assignment.split('=');
    if (keyValuePair.length !== 2) return tryParseJson(keyValuePair[0]);
    const [key, value] = keyValuePair;

    return { [key]: tryParseJson(value) };
};

type ProcessStatePatchResult = Record<string, any> | undefined;

/**
 * Get all state patches from process args and parse them to return an aggregated state object patch
 */
export const processStatePatch = (): ProcessStatePatchResult =>
    process.argv
        .map(arg => arg.match(/^--state=(.+)/))
        .filter(arg => arg !== null)
        .map(match => parseAssignment(match[1]))
        .reduce<ProcessStatePatchResult>(
            (prev, cur) => mergeDeepObject.withOptions({ dotNotation: true }, prev ?? {}, cur),
            undefined,
        );
