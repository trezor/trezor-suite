import { BigNumber } from '@trezor/utils';

import { buildErc721SafeTransferFrom } from '../../../builder/evm/erc721SafeTransferFrom';
import { asEvmAddress } from '../../../types/evm';

const SENDER = asEvmAddress('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3');
const RECIPIENT = asEvmAddress('0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96');

describe('buildErc721SafeTransferFrom', () => {
    it('encodes valid safeTransferFrom calldata', () => {
        const result = buildErc721SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                tokenId: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x42842e0e0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3000000000000000000000000b836472d21991eb9842e15beae1af6c8b63d6a960000000000000000000000000000000000000000000000000000000000000001',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('encodes large tokenId correctly', () => {
        const result = buildErc721SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                tokenId: new BigNumber('99999999999999999999'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('returns warning when recipient is sender', () => {
        const result = buildErc721SafeTransferFrom(
            {
                from: SENDER,
                to: SENDER,
                tokenId: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.warnings).toEqual([{ code: 'SELF_ADDRESS', path: 'to', severity: 'warning' }]);
        expect(result.errors).toEqual([]);
    });

    it('allows burn to zero address with a warning', () => {
        const result = buildErc721SafeTransferFrom(
            {
                from: SENDER,
                to: '0x0000000000000000000000000000000000000000',
                tokenId: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContainEqual({
            code: 'ZERO_ADDRESS',
            path: 'to',
            severity: 'warning',
        });
        expect(result.errors).toEqual([]);
    });

    it('returns error for token id zero', () => {
        const result = buildErc721SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                tokenId: new BigNumber('0'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([{ code: 'ZERO_AMOUNT', path: 'tokenId', severity: 'error' }]);
    });

    it('returns error for invalid recipient address', () => {
        const result = buildErc721SafeTransferFrom(
            {
                from: SENDER,
                to: 'not-an-address',
                tokenId: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'INVALID_ADDRESS', path: 'to', severity: 'error' },
        ]);
    });

    it('returns error when from does not match sender', () => {
        const OTHER = asEvmAddress('0x1111111111111111111111111111111111111111');

        const result = buildErc721SafeTransferFrom(
            {
                from: OTHER,
                to: RECIPIENT,
                tokenId: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'from', severity: 'error' },
        ]);
    });

    it('returns error for zero from address', () => {
        const result = buildErc721SafeTransferFrom(
            {
                from: '0x0000000000000000000000000000000000000000',
                to: RECIPIENT,
                tokenId: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toContainEqual({
            code: 'ZERO_ADDRESS',
            path: 'from',
            severity: 'error',
        });
    });
});
