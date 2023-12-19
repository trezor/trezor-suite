import {
    isAddressDeprecated,
    isAddressValid,
    isBech32AddressUppercase,
    isDecimalsValid,
    isHexValid,
    isInteger,
    isTaprootAddress,
} from '../validationUtils';

describe('validation', () => {
    // fixtures from https://github.com/trezor/trezor-address-validator/blob/master/test/wallet_address_validator.js
    it('isAddressValid', () => {
        // BTC valid
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

        // BTC invalid
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

        // TEST valid
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

        // TEST invalid
        expect(isAddressValid('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'test')).toEqual(false);
        expect(isAddressValid('3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn', 'test')).toEqual(false);
        expect(isAddressValid('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'test')).toEqual(false);
        expect(isAddressValid('BC1SW50QA3JX3S', 'test')).toEqual(false);

        // ETH, ETC, TGOR, TSEP, THOL
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'eth')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'eth')).toEqual(false);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'etc')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'etc')).toEqual(false);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'tsep')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'tsep')).toEqual(
            false,
        );
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'tgor')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'tgor')).toEqual(
            false,
        );
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', 'thol')).toEqual(true);
        expect(isAddressValid('0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF0', 'thol')).toEqual(
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

    it('isTaprootAddress', () => {
        expect(isTaprootAddress('', 'btc')).toBe(false);
        expect(isTaprootAddress('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'btc')).toBe(false);
        expect(
            isTaprootAddress(
                'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
                'btc',
            ),
        ).toBe(false);
        expect(
            isTaprootAddress(
                'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                'btc',
            ),
        ).toBe(true);
        expect(
            isTaprootAddress(
                'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
                'test',
            ),
        ).toEqual(true);
    });

    it('isBech32AddressUppercase', () => {
        expect(isBech32AddressUppercase('')).toBe(false);
        expect(isBech32AddressUppercase('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj')).toBe(false);
        expect(isBech32AddressUppercase('BC1SW50QA3JX3S')).toBe(true);
        expect(isBech32AddressUppercase('tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9')).toBe(false);
        expect(isBech32AddressUppercase('TB1QKVWU9G3K2PDXEWFQR7SYZ89R3GJ557L3UUF9R9')).toBe(true);
        expect(isBech32AddressUppercase('ltc1qkzyarpkhdecu5rzeuj78pwpr5sfm798afny4n6')).toBe(false);
        expect(isBech32AddressUppercase('LTC1QKZYARPKHDECU5RZEUJ78PWPR5SFM798AFNY4N6')).toBe(true);
        expect(isBech32AddressUppercase('tltc1qkvwu9g3k2pdxewfqr7syz89r3gj557l395tmnv')).toBe(
            false,
        );
        expect(isBech32AddressUppercase('TLTC1QKVWU9G3K2PDXEWFQR7SYZ89R3GJ557L395TMNV')).toBe(true);
        expect(isBech32AddressUppercase('37VJHKeBA9DHKmTwYE7TWYjwDzo5JTb1sz')).toBe(false); // real btc address contains tb1 string
        expect(isBech32AddressUppercase('NotValidAddressContainsTb1bc1Ltc1Tltc1')).toBe(false);
    });

    // https://litecoin-project.github.io/p2sh-convert/
    // https://cashaddr.bitcoincash.org/
    it('isAddressDeprecated', () => {
        expect(isAddressDeprecated('3notValid', 'ltc')).toBe(undefined);
        expect(isAddressDeprecated('3NP9U8dbNzBcwhChpX8nk4F3Bf2oSucXj1', 'ltc')).toBe(
            'LTC_ADDRESS_INFO_URL',
        );
        expect(isAddressDeprecated('1notValid', 'bch')).toBe(undefined);
        expect(isAddressDeprecated('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bch')).toBe(
            'HELP_CENTER_CASHADDR_URL',
        );
    });

    it('isHexValid', () => {
        expect(isHexValid('')).toBe(false);
        expect(isHexValid('1')).toBe(false);
        expect(isHexValid('01')).toBe(true);
        expect(isHexValid('dead')).toBe(true);
        expect(isHexValid('N07Hex')).toBe(false);
        expect(isHexValid('0x0')).toBe(false);
        expect(isHexValid('0x0', '0x')).toBe(true); // eth hex could be left padded (0x0 === 0x00)
        expect(isHexValid('0x00', '0x')).toBe(true);
        expect(isHexValid('0xDeadBeeF', '0x')).toBe(true);
        expect(isHexValid('0xNotHex', '0x')).toBe(false);
        // Solana TX hex examples
        expect(
            isHexValid(
                '0100fe5285137d4b360a7e5670c32b31169e68a6ca8e7fd5850d2ba1376ef840a932da5198d245b65cdf7e623502168e4c751055fcef49b1ddb71446a62b7d1c0f01000204ee2d5f82e922ca83643a2d5f12e93292f18dfcbf38205f7642d96e73973fc9a0c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c600000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000063ebe0204aca594c903658d46c0f24c3aeba6e69bd4c42717afde0545355dc8103020200010c0200000040420f000000000003000903d8d600000000000003000502400d0300',
                '0x',
            ),
        ).toBe(true);
        expect(
            isHexValid(
                '0x0100fe5285137d4b360a7e5670c32b31169e68a6ca8e7fd5850d2ba1376ef840a932da5198d245b65cdf7e623502168e4c751055fcef49b1ddb71446a62b7d1c0f01000204ee2d5f82e922ca83643a2d5f12e93292f18dfcbf38205f7642d96e73973fc9a0c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c600000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000063ebe0204aca594c903658d46c0f24c3aeba6e69bd4c42717afde0545355dc8103020200010c0200000040420f000000000003000903d8d600000000000003000502400d0300',
                '0x',
            ),
        ).toBe(true);
    });
});
