import type { Label } from '@trezor/network-module-suite-common-types';

/** Translation ids shared with the desktop catalog, so these are translated wherever it is. */
export const bitcoinMessageSigningLabels = {
    title: { id: 'TR_NAV_SIGN_VERIFY', defaultMessage: 'Sign & verify messages' },
    format: { id: 'TR_FORMAT', defaultMessage: 'Format' },
    formatTooltip: {
        id: 'TR_FORMAT_TOOLTIP',
        defaultMessage:
            '<FormatDescription> <span>Trezor</span> – standard signature format according to BIP137 </FormatDescription> <FormatDescription> <span>Electrum</span> – compatibility signature format </FormatDescription>',
    },
    formatDefault: { id: 'TR_BIP_SIG_FORMAT', defaultMessage: 'Trezor' },
    formatElectrum: { id: 'TR_COMPATIBILITY_SIG_FORMAT', defaultMessage: 'Electrum' },
    freshAddresses: { id: 'TR_ADDRESSES_FRESH', defaultMessage: 'Fresh addresses' },
    usedAddresses: { id: 'TR_ADDRESSES_USED', defaultMessage: 'Used addresses' },
    changeAddresses: { id: 'TR_ADDRESSES_CHANGE', defaultMessage: 'Change addresses' },
} as const satisfies Record<string, Label>;
