import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Firmware ground-truth test vectors live in the `trezor-common` git submodule.
 * That submodule is a read-only export of `trezor-firmware/common`, where the
 * very same vectors drive the firmware device tests, so they are intentionally
 * NOT vendored into this repo — `trezor-firmware` remains their single source of
 * truth. The submodule is only required to actually run the connect e2e suite
 * and is cloned just for that CI job (see template-connect-test-params.yml).
 *
 * To keep type-checking, unit tests and local dev working without the submodule
 * checked out, the vectors are loaded lazily at runtime: when the submodule is
 * present its fixtures are returned, otherwise a loud warning is printed once
 * and an empty fixture is returned so the affected test cases are simply
 * skipped instead of crashing the whole run.
 *
 * Clone with: `git submodule update --init submodules/trezor-common`
 */

export interface CommonFixture {
    setup: { mnemonic: string; [key: string]: unknown };
    // Vectors are firmware ground truth with a per-method shape; consumers pick
    // the fields they need, so `unknown` keeps them honest without duplicating
    // every fixture schema here.
    tests: any[];
}

// commonFixtures.ts -> __fixtures__ -> e2e -> connect -> packages -> repo root
const FIXTURES_ROOT = join(__dirname, '../../../../submodules/trezor-common/tests/fixtures');

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

/** Whether the trezor-common submodule is checked out and its fixtures are usable. */
export const commonFixturesAvailable = () => existsSync(FIXTURES_ROOT);

/**
 * Lazily load a firmware test-vector file from the trezor-common submodule.
 *
 * @param relativePath path within `trezor-common/tests/fixtures`, e.g. `ethereum/getaddress.json`
 * @returns the parsed fixture, or an empty fixture (and a one-off warning) when
 *          the submodule is not checked out
 */
export const loadCommonFixture = (relativePath: string): CommonFixture => {
    const absolutePath = join(FIXTURES_ROOT, relativePath);
    if (!existsSync(absolutePath)) {
        warnSubmoduleMissing();

        return EMPTY_FIXTURE;
    }

    return JSON.parse(readFileSync(absolutePath, 'utf8')) as CommonFixture;
};
