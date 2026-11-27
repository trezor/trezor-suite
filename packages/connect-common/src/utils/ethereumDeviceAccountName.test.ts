import { getEthereumDeviceAccountName } from './ethereumDeviceAccountName';

describe(getEthereumDeviceAccountName.name, () => {
    it.each([
        // Trezor Suite: the address index numbers the account.
        ["m/44'/60'/0'/0/0", 'ETH #1'],
        ["m/44'/60'/0'/0/4", 'ETH #5'],
        // Ledger Live: the hardened account.
        ["m/44'/60'/2'/0/0", 'ETH #3'],
        ["m/44'/60'/7'", 'ETH #8'],
        ["m/44'/60'/0'/3", 'ETH #4'],
        ["m/45'/60/1/0/0", 'ETH #2'],
        // The name says ETH on any network.
        ["m/44'/61'/0'/0/1", 'ETH #2'],
    ])('names %s as %s', (path, name) => {
        expect(getEthereumDeviceAccountName(path)).toBe(name);
    });

    it.each(["m/44'/60'/101'/0/0", "m/44'/60'/0'/2/0", "m/84'/0'/0'/0/0", 'not a path'])(
        'has no name for %s',
        path => {
            expect(getEthereumDeviceAccountName(path)).toBeUndefined();
        },
    );
});
