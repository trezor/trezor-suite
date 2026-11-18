import { dialog, app as electronApp } from 'electron';

export const isValidProtocol = (uri: string, protocols: string[]) =>
    protocols.findIndex(p => uri.startsWith(`${p}:`)) > -1;

// Proper deep links must have these characters URI-encoded, so they must not be present raw.
const UNPERMITTED_DEEPLINK_CHARACTER = /[\s"]/;

export const hasUnpermittedDeeplinkCharacters = (deeplink: string) =>
    UNPERMITTED_DEEPLINK_CHARACTER.test(deeplink);

/**
 * Reforms the deep link that the app was launched with on Windows and Linux, in case it got split into multiple args.
 * This is not relevant for macOS, where deep links are delivered via an `open-url` event instead of process arguments,
 * see https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#macos-code
 * Returns undefined if the app was not launched with a deep link (that's the most common case).
 */
export const getLaunchDeeplinkWithTrailingArgs = (
    argv: string[],
    protocols: string[],
): string | undefined => {
    const deeplinkIndex = argv.findIndex(arg =>
        protocols.some(protocol => arg.toLowerCase().startsWith(`${protocol.toLowerCase()}:`)),
    );

    return deeplinkIndex === -1 ? undefined : argv.slice(deeplinkIndex).join(' ');
};

const showUnpermittedDeeplinkAlertAndExit = () => {
    // On Windows, this opens a visible system dialog to warn the user, while on Linux it just prints to stderr.
    // To show a visible GUI on Linux, we'd have to await electronApp.whenReady(), but the app needs to exit immediately,
    // because by then, the electron app would process its switches.
    dialog.showErrorBox(
        'Invalid deep link',
        'Trezor Suite was opened by a link with forbidden characters (spaces or quotes).\nIf you opened it intentionally, please verify where the link came from.\nDo not interact with it in case of suspicion.',
    );
    electronApp.exit(1);
};

/**
 * Shows an alert and exits the app if it was launched with a deep link containing unpermitted characters.
 * Returns whether the app is exiting.
 */
export const exitIfLaunchDeeplinkIsUnpermitted = (): boolean => {
    const launchDeeplink = getLaunchDeeplinkWithTrailingArgs(
        process.argv,
        // Set by core.webpack.config.ts. If it's missing, this throws to fail-closed instead of silently returning.
        process.env.PROTOCOLS as unknown as string[],
    );

    if (launchDeeplink !== undefined && hasUnpermittedDeeplinkCharacters(launchDeeplink)) {
        showUnpermittedDeeplinkAlertAndExit();

        return true;
    }

    return false;
};
