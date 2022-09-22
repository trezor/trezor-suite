// mapping of normal to tor domains.
// we probably can list only domains that trezor has under control, for security reasons
// it is maybe likely that this map will have only one record forever?
export const TOR_URLS: { [key: string]: string } = {
    'trezor.io': 'trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
};
