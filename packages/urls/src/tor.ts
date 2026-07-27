// mapping of normal to tor domains.
// we probably can list only domains that trezor has under control, for security reasons
// it is maybe likely that this map will have only one record forever?
export const TOR_URLS = {
    'sldev.cz': 'sldevz5tqu7uh4owm4gg5erbn3doap5rhilvkwtvdq7ihibfpzw2a5ad.onion',
    'trezor.io': 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
} as const;
