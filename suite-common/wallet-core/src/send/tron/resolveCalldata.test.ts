import { type TokenInfo } from '@trezor/connect';

import { resolveCalldata } from './resolveCalldata';

const token = { contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' } as TokenInfo;

describe('resolveCalldata', () => {
    it('returns explicit calldata when userCallDataHex is present, ignoring the token', () => {
        const result = resolveCalldata({
            token,
            outputAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            amountInSubunits: '20177186',
            userCallDataHex: '095ea7b3deadbeef',
        });

        expect(result).toEqual({ data: '095ea7b3deadbeef' });
    });

    it('encodes a TRC-20 transfer when only a token is present', () => {
        const result = resolveCalldata({
            token,
            outputAddress: 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr',
            amountInSubunits: '1000000',
            userCallDataHex: '',
        });

        expect(result).toHaveProperty('data');
        expect((result as { data: string }).data).toMatch(/^a9059cbb/);
    });

    it('returns null data for a plain TRX transfer', () => {
        const result = resolveCalldata({
            token: undefined,
            outputAddress: 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr',
            amountInSubunits: '1000000',
            userCallDataHex: '',
        });

        expect(result).toEqual({ data: null });
    });
});
