import { isAddressValid } from '../isAddressValid';

// fixtures from https://github.com/trezor/trezor-address-validator/blob/master/test/wallet_address_validator.js
describe('isAddressValid', () => {
    it('BTC valid', () => {
        expect(isAddressValid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'btc')).toEqual(true);
        expect(isAddressValid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn', 'btc')).toEqual(true);
        expect(isAddressValid('BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', 'btc')).toEqual(true);
        expect(isAddressValid('bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d', 'btc')).toEqual(true); // p2pkh
        expect(
            isAddressValid('bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q', 'btc'),
        ).toEqual(true); // p2wsh
        expect(
            isAddressValid('bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr', 'btc'),
        ).toEqual(true); // p2tr
    });

    it('BTC invalid', () => {
        expect(isAddressValid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'btc')).toEqual(false);
        expect(isAddressValid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'btc')).toEqual(false);
        expect(isAddressValid('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5', 'btc')).toEqual(false);
        expect(isAddressValid('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'btc')).toEqual(false); // p2w-unknown
        expect(
            isAddressValid('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', 'btc'),
        ).toEqual(false); // testnet address
        expect(isAddressValid('BC1SW50QA3JX3S', 'btc')).toEqual(false); // p2w-unknown
        expect(isAddressValid('bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs', 'btc')).toEqual(false); // version 2
        expect(isAddressValid('BC1SW50QGDZ25J', 'btc')).toEqual(false); // version 16
        expect(
            isAddressValid(
                'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx',
                'btc',
            ),
        ).toEqual(false); // p2w-unknown
    });

    it('TEST valid', () => {
        expect(isAddressValid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'test')).toEqual(true);
        expect(isAddressValid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'test')).toEqual(true);
        expect(
            isAddressValid(
                'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
                'test',
            ),
        ).toEqual(true);
        expect(
            isAddressValid(
                'tb1qusxlgq9quu27ucxs7a2fg8nv0pycdzvxsjk9npyupupxw3y892ssaskm8v',
                'test',
            ),
        ).toEqual(true); // p2wsh
        expect(
            isAddressValid(
                'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
                'test',
            ),
        ).toEqual(true); // taproot
        expect(isAddressValid('GSa5espVLNseXEfKt46zEdS6jrPkmFghBU', 'test')).toEqual(true); // regtest
    });

    it('TEST invalid', () => {
        expect(isAddressValid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'test')).toEqual(false);
        expect(isAddressValid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn', 'test')).toEqual(false);
        expect(isAddressValid('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'test')).toEqual(false);
        expect(isAddressValid('BC1SW50QA3JX3S', 'test')).toEqual(false);
    });

    it('ETH, ETC, TSEP, THOD', () => {
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'eth')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'eth')).toEqual(false);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'etc')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'etc')).toEqual(false);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'tsep')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'tsep')).toEqual(
            false,
        );
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'thod')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'thod')).toEqual(
            false,
        );
    });

    it('XRP, tXRP', () => {
        expect(isAddressValid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'xrp')).toEqual(true);
        expect(isAddressValid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'txrp')).toEqual(true);
        expect(isAddressValid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN', 'xrp')).toEqual(true);
        expect(isAddressValid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN', 'txrp')).toEqual(true);
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV0', 'xrp')).toEqual(false);
    });
});
