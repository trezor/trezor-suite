import type { Label } from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const ethereumMessageSigningLabels = {
    title: { id: 'TR_NAV_SIGN_VERIFY', defaultMessage: 'Sign & verify messages' },
} as const satisfies Record<string, Label>;
