import type { Label } from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const cardanoMessageSigningLabels = {
    // Cardano signs but cannot verify, so the title never promises verification.
    title: { id: 'TR_SIGN_MESSAGE', defaultMessage: 'Sign message' },
    format: { id: 'TR_FORMAT', defaultMessage: 'Format' },
    formatDefault: { id: 'TR_PUBLIC_KEY_RAW', defaultMessage: 'Raw key (default)' },
    formatCose: { id: 'TR_PUBLIC_KEY_COSE', defaultMessage: 'COSE (CIP-30)' },
    stakingAddress: { id: 'TR_STAKING_STAKE_ADDRESS', defaultMessage: 'Your stake address' },
    freshAddresses: { id: 'TR_ADDRESSES_FRESH', defaultMessage: 'Fresh addresses' },
    usedAddresses: { id: 'TR_ADDRESSES_USED', defaultMessage: 'Used addresses' },
    changeAddresses: { id: 'TR_ADDRESSES_CHANGE', defaultMessage: 'Change addresses' },
} as const satisfies Record<string, Label>;
