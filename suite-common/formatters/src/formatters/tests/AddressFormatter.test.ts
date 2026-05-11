import { AddressFormatter } from '../AddressFormatter';

const EVM_ADDRESS = '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe';
const BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const ADA_ADDRESS =
    'addr1qyuudk3newmzjwcz4eyypnpcexvcyww4znuw5g40dlt7fdeecmdr8jak9yas9tjggrxr3jvesgua298cag723m7hujmspd3k22';
const SOL_ADDRESS = '14CCvQzQzHCVgZM3j9soPnXuJXh1RmCfwLVUcdfbZVBS';

describe('AddressFormatter', () => {
    describe('full', () => {
        it.each([
            ['EVM', EVM_ADDRESS, '0x de0B 2956 69a9 FD93 d5F2 8D9E c85E 40f4 cb69 7BAe'],
            ['BTC', BTC_ADDRESS, 'bc1q ar0s rrr7 xfkv y5l6 43ly dnw9 re59 gtzz wf5m dq'],
            [
                'ADA',
                ADA_ADDRESS,
                'addr 1qyu udk3 newm zjwc z4ey ypnp cexv cyww 4znu w5g4 0dlt 7fde ecmd r8ja k9ya s9tj ggrx r3jv esgu a298 cag7 23m7 hujm spd3 k22',
            ],
            ['SOL', SOL_ADDRESS, '14CC vQzQ zHCV gZM3 j9so PnXu JXh1 RmCf wLVU cdfb ZVBS'],
        ])('chunks %s address with spaces every 4 chars', (_label, address, expected) => {
            expect(AddressFormatter.format(address, { format: 'full' })).toBe(expected);
        });

        it('defaults to full when format is omitted', () => {
            expect(AddressFormatter.format(EVM_ADDRESS)).toBe(
                '0x de0B 2956 69a9 FD93 d5F2 8D9E c85E 40f4 cb69 7BAe',
            );
        });

        it('returns continuous string when isChunked is false', () => {
            expect(AddressFormatter.format(EVM_ADDRESS, { format: 'full', isChunked: false })).toBe(
                '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
            );
        });
    });

    describe('long', () => {
        it.each([
            ['EVM', EVM_ADDRESS, '0x de0B 2956 ... cb69 7BAe'],
            ['BTC', BTC_ADDRESS, 'bc1q ar0s ... wf5m dq'],
            ['ADA', ADA_ADDRESS, 'addr 1qyu ... spd3 k22'],
            ['SOL', SOL_ADDRESS, '14CC vQzQ ... cdfb ZVBS'],
        ])(
            'shows first 2 chunks + ... + last chunks for %s address',
            (_label, address, expected) => {
                expect(AddressFormatter.format(address, { format: 'long', isChunked: true })).toBe(
                    expected,
                );
            },
        );

        it.each([
            ['EVM', EVM_ADDRESS, '0xde0B2956...cb697BAe'],
            ['BTC', BTC_ADDRESS, 'bc1qar0s...wf5mdq'],
            ['ADA', ADA_ADDRESS, 'addr1qyu...spd3k22'],
            ['SOL', SOL_ADDRESS, '14CCvQzQ...cdfbZVBS'],
        ])(
            'returns continuous string with truncation for %s when isChunked is false',
            (_label, address, expected) => {
                expect(AddressFormatter.format(address, { format: 'long', isChunked: false })).toBe(
                    expected,
                );
            },
        );
    });

    describe('short', () => {
        it.each([
            ['EVM', EVM_ADDRESS, '0x de0B ... cb69 7BAe'],
            ['BTC', BTC_ADDRESS, 'bc1q ... wf5m dq'],
            ['ADA', ADA_ADDRESS, 'addr ... spd3 k22'],
            ['SOL', SOL_ADDRESS, '14CC ... cdfb ZVBS'],
        ])(
            'shows first 1 chunk + ... + last chunks for %s address',
            (_label, address, expected) => {
                expect(AddressFormatter.format(address, { format: 'short', isChunked: true })).toBe(
                    expected,
                );
            },
        );

        it.each([
            ['EVM', EVM_ADDRESS, '0xde0B...cb697BAe'],
            ['BTC', BTC_ADDRESS, 'bc1q...wf5mdq'],
            ['ADA', ADA_ADDRESS, 'addr...spd3k22'],
            ['SOL', SOL_ADDRESS, '14CC...cdfbZVBS'],
        ])(
            'returns continuous string with truncation for %s when isChunked is false',
            (_label, address, expected) => {
                expect(
                    AddressFormatter.format(address, { format: 'short', isChunked: false }),
                ).toBe(expected);
            },
        );
    });

    describe('edge cases', () => {
        it.each(['full', 'long', 'short'] as const)(
            '%s format returns address unchanged when it does not match regex',
            format => {
                expect(AddressFormatter.format('abc123', { format })).toBe('abc123');
            },
        );
    });
});
