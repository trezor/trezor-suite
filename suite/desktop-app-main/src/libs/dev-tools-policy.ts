import { isCodesignBuild } from '@trezor/env-utils';

import { hasSwitch } from './process-switches';

/**
 * Whether an inspector may be attached to *embedded third-party content* in this run.
 *
 * DevTools are available in development, and in a signed production build only when explicitly
 * enabled with `--open-devtools`. Read from the build and the command line, never from the
 * renderer: Suite's debug mode is redux state a page could set, which makes it a fine reason to
 * *show* a control and no kind of gate at all behind one. An embedded app is someone else's page,
 * so the gate in front of it does not get to depend on anything that page can reach.
 *
 * Deliberately stricter than the F12 shortcuts, which `shortcuts.ts` also opens under debug mode
 * (and re-reads per keypress, since that flag is toggleable at runtime). That looser gate applies
 * to Suite's own window; do not widen this one to match it.
 *
 * DevTools are only available in development, or in production when explicitly enabled via CLI flag.
 */
export const isDevToolsEnabled = !isCodesignBuild() || hasSwitch('open-devtools');
