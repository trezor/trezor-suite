import { isAddressValid, isDecimalsValid, isInteger } from '../validation';

describe('validation', () => {
    // fixtures from https://github.com/trezor/trezor-address-validator/blob/master/test/wallet_address_validator.js
    it('isAddressValid', () => {
        // BTC valid
        expect(isAddressValid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'btc')).toEqual(true);
        expect(isAddressValid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn', 'btc')).toEqual(true);
        expect(isAddressValid('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'btc')).toEqual(true);
        expect(
            isAddressValid(
                'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx',
                'btc',
            ),
        ).toEqual(true);
        expect(isAddressValid('BC1SW50QA3JX3S', 'btc')).toEqual(true);
        expect(isAddressValid('BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', 'btc')).toEqual(true);

        // BTC invalid
        expect(isAddressValid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'btc')).toEqual(false);
        expect(isAddressValid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'btc')).toEqual(false);
        expect(isAddressValid('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5', 'btc')).toEqual(false);
        expect(
            isAddressValid('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', 'btc'),
        ).toEqual(false); // testnet address

        // TEST valid
        expect(isAddressValid('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', 'test')).toEqual(true);
        expect(isAddressValid('2MxKEf2su6FGAUfCEAHreGFQvEYrfYNHvL7', 'test')).toEqual(true);
        expect(
            isAddressValid(
                'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
                'test',
            ),
        ).toEqual(true);
        expect(isAddressValid('GSa5espVLNseXEfKt46zEdS6jrPkmFghBU', 'test')).toEqual(true); // regtest

        // TEST invalid
        expect(isAddressValid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'test')).toEqual(false);
        expect(isAddressValid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn', 'test')).toEqual(false);
        expect(isAddressValid('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'test')).toEqual(false);
        expect(isAddressValid('BC1SW50QA3JX3S', 'test')).toEqual(false);

        // ETH, ETC, TROP
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'eth')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'eth')).toEqual(false);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'etc')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'etc')).toEqual(false);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'trop')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'trop')).toEqual(
            false,
        );

        // XRP, tXRP
        expect(isAddressValid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'xrp')).toEqual(true);
        expect(isAddressValid('rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn', 'txrp')).toEqual(true);
        expect(isAddressValid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN', 'xrp')).toEqual(true);
        expect(isAddressValid('rDTXLQ7ZKZVKz33zJbHjgVShjsBnqMBhmN', 'txrp')).toEqual(true);
        expect(isAddressValid('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV0', 'xrp')).toEqual(false);
    });

    it('isDecimalsValid', () => {
        expect(isDecimalsValid('0', 18)).toBe(true);
        expect(isDecimalsValid('0.0', 18)).toBe(true);
        expect(isDecimalsValid('0.00000000', 18)).toBe(true);
        expect(isDecimalsValid('0.00000001', 18)).toBe(true);
        expect(isDecimalsValid('+0.0', 18)).toBe(false);
        expect(isDecimalsValid('-0.0', 18)).toBe(false);
        expect(isDecimalsValid('1', 18)).toBe(true);
        expect(isDecimalsValid('+1', 18)).toBe(false);
        expect(isDecimalsValid('+100000', 18)).toBe(false);
        expect(isDecimalsValid('.', 18)).toBe(false);
        expect(isDecimalsValid('-.1', 18)).toBe(false);
        expect(isDecimalsValid('0.1', 18)).toBe(true);
        expect(isDecimalsValid('0.12314841', 18)).toBe(true);
        expect(isDecimalsValid('0.1381841848184814818391931933', 18)).toBe(false); // 28 decimals
        expect(isDecimalsValid('0.100000000000000000', 18)).toBe(true); // 18s decimals

        expect(isDecimalsValid('100.', 18)).toBe(true);
        expect(isDecimalsValid('.1', 18)).toBe(false);
        expect(isDecimalsValid('.000000001', 18)).toBe(false);
        expect(isDecimalsValid('.13134818481481841', 18)).toBe(false);

        expect(isDecimalsValid('001.12314841', 18)).toBe(false);
        expect(isDecimalsValid('83819319391491949941', 18)).toBe(true);
        expect(isDecimalsValid('-83819319391491949941', 18)).toBe(false);
        expect(isDecimalsValid('+0.131831848184', 18)).toBe(false);
        expect(isDecimalsValid('0.127373193981774718318371831731761626162613', 18)).toBe(false);

        expect(isDecimalsValid('0.131831848184a', 18)).toBe(false);
        expect(isDecimalsValid('100a', 18)).toBe(false);
        expect(isDecimalsValid('.100a', 18)).toBe(false);
        expect(isDecimalsValid('a.100', 18)).toBe(false);
        expect(isDecimalsValid('abc', 18)).toBe(false);
        expect(isDecimalsValid('1abc0', 18)).toBe(false);
    });

    it('isInteger', () => {
        expect(isInteger('0')).toBe(true);
        expect(isInteger('1')).toBe(true);
        expect(isInteger('321')).toBe(true);
        expect(isInteger('01')).toBe(false);
        expect(isInteger('.01')).toBe(false);
        expect(isInteger('0.1')).toBe(false);
        expect(isInteger('01.')).toBe(false);
        expect(isInteger('a01')).toBe(false);
        expect(isInteger('0a1')).toBe(false);
        expect(isInteger('01a')).toBe(false);
    });
});
