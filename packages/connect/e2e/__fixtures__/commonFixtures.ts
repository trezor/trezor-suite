import { FIXTURES } from 'virtual:common-fixtures';

// Firmware test vectors from the `trezor-common` submodule (not vendored). They
// are injected at build time by `commonFixturesPlugin` (vitest.config.ts) so no
// `fs` reaches the browser. When the submodule is absent the map is empty and the
// affected cases are skipped. Clone: `git submodule update --init submodules/trezor-common`.

export interface CommonFixture {
    setup: { mnemonic: string; [key: string]: unknown };
    // Per-method shape; consumers pick the fields they need.
    tests: any[];
}

const EMPTY_FIXTURE: CommonFixture = { setup: { mnemonic: '' }, tests: [] };

let warningPrinted = false;

const warnSubmoduleMissing = () => {
    if (warningPrinted) return;
    warningPrinted = true;
    console.warn(
        [
            '',
            '████████████████████████████████████████████████████████████████████████',
            '  trezor-common submodule is not checked out.',
            '',
            '  Firmware ground-truth test vectors are unavailable, so the related',
            '  connect fixture test cases were SKIPPED.',
            '',
            '  To run them, clone the submodule:',
            '      git submodule update --init submodules/trezor-common',
            '████████████████████████████████████████████████████████████████████████',
            '',
        ].join('\n'),
    );
};

/** Whether the trezor-common submodule is checked out. */
export const commonFixturesAvailable = () => Object.keys(FIXTURES).length > 0;

/** Load a fixture by its path within `trezor-common/tests/fixtures`, e.g. `ethereum/getaddress.json`. */
export const loadCommonFixture = (relativePath: string): CommonFixture => {
    const fixture = FIXTURES[relativePath];
    if (!fixture) {
        warnSubmoduleMissing();

        return EMPTY_FIXTURE;
    }

    return fixture;
};
