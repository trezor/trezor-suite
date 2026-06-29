import { BigNumber } from '@trezor/utils';

import { buildErc1155SafeTransferFrom } from '../../../builder/evm/erc1155SafeTransferFrom';
import { asEvmAddress } from '../../../types/evm';

const SENDER = asEvmAddress('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3');
const RECIPIENT = asEvmAddress('0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96');

describe('buildErc1155SafeTransferFrom', () => {
    it('encodes valid safeTransferFrom calldata with empty data bytes', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                id: new BigNumber('42'),
                amount: new BigNumber('3'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xf242432a0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3000000000000000000000000b836472d21991eb9842e15beae1af6c8b63d6a96000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns warning when recipient is sender', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: SENDER,
                id: new BigNumber('1'),
                amount: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.warnings).toEqual([{ code: 'SELF_ADDRESS', path: 'to', severity: 'warning' }]);
        expect(result.errors).toEqual([]);
    });

    it('returns error for zero amount', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                id: new BigNumber('1'),
                amount: new BigNumber('0'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'ZERO_AMOUNT', path: 'amount', severity: 'error' },
        ]);
    });

    it('allows burn to zero address with a warning', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: '0x0000000000000000000000000000000000000000',
                id: new BigNumber('1'),
                amount: new BigNumber('5'),
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

    it('returns error for invalid recipient address', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: 'not-an-address',
                id: new BigNumber('1'),
                amount: new BigNumber('5'),
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

        const result = buildErc1155SafeTransferFrom(
            {
                from: OTHER,
                to: RECIPIENT,
                id: new BigNumber('1'),
                amount: new BigNumber('5'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'from', severity: 'error' },
        ]);
    });

    it('accepts token id of zero (valid ERC1155 id)', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                id: new BigNumber('0'),
                amount: new BigNumber('1'),
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});
