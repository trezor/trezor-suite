import { BigNumber } from '@trezor/utils';

import { buildErc1155SafeTransferFrom, buildErc721SafeTransferFrom } from './safeTransferFrom';
import { asEvmAddress } from '../../../types/evm';

const SENDER = asEvmAddress('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3');
const RECIPIENT = asEvmAddress('0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96');
const MAX_UINT256_ID =
    '115792089237316195423570985008687907853269984665640564039457584007913129639935';

describe('buildErc721SafeTransferFrom', () => {
    it('encodes a uint256-max token id without precision loss', () => {
        const result = buildErc721SafeTransferFrom(
            { from: SENDER, to: RECIPIENT, tokenId: new BigNumber(MAX_UINT256_ID) },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x42842e0e0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3000000000000000000000000b836472d21991eb9842e15beae1af6c8b63d6a96ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        );
    });

    it('accepts token id 0', () => {
        const result = buildErc721SafeTransferFrom(
            { from: SENDER, to: RECIPIENT, tokenId: new BigNumber(0) },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('rejects a `from` other than the sender', () => {
        const result = buildErc721SafeTransferFrom(
            { from: RECIPIENT, to: RECIPIENT, tokenId: new BigNumber(1) },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
    });
});

describe('buildErc1155SafeTransferFrom', () => {
    it('encodes calldata with empty data', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                id: new BigNumber(42),
                amount: new BigNumber(1),
                data: '0x',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xf242432a0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3000000000000000000000000b836472d21991eb9842e15beae1af6c8b63d6a96000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000',
        );
    });

    it('rejects a zero amount', () => {
        const result = buildErc1155SafeTransferFrom(
            {
                from: SENDER,
                to: RECIPIENT,
                id: new BigNumber(42),
                amount: new BigNumber(0),
                data: '0x',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
    });
});
