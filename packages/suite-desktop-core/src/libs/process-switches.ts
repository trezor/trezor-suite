export type SuiteSwitch =
    | 'open-devtools'
    | 'tor'
    | 'pre-release'
    | 'enable-updater'
    | 'disable-updater'
    | 'updater-url'
    | 'bridge-legacy'
    | 'bridge-test'
    | 'bridge-dev'
    | 'skip-new-bridge-rollout'
    | 'bridge-daemon'
    | 'bridge-daemon-show-ui'
    | 'log-level'
    | 'log-write'
    | 'log-ui'
    | 'log-file'
    | 'log-path'
    | 'log-no-print'
    | 'log-connect'
    | 'remove-user-data-on-start'
    | 'expose-connect-ws'
    | 'state'; // very special handling, see `./app-utils.ts`

/**
 * Check if a switch is present in process arguments.
 */
export const hasSwitch = (switchName: SuiteSwitch) => {
    const isSwitch = new RegExp(`^--${switchName}(?:=[^=]+)?=?$`);

    return process.argv.some(arg => isSwitch.test(arg));
};

/**
 * Get value of a switch from process arguments, if present and if it has a value.
 * Returns empty string otherwise, as Electron's `app.commandLine.getSwitchValue`.
 */
export const getSwitchValue = (switchName: SuiteSwitch): string => {
    const switchValueMatch = new RegExp(`^--${switchName}=(.+)$`);
    const valueMatch = process.argv.map(arg => arg.match(switchValueMatch)).find(Boolean);
    if (!valueMatch) return '';

    return valueMatch[1];
};
