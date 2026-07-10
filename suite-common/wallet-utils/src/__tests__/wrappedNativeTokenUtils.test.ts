import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    getUnwrapAmountByEthereumDataHex,
    isUnwrapNativeTx,
    isWrapNativeTx,
} from '../wrappedNativeTokenUtils';

const WETH_ADDRESS_CHECKSUMMED = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const UNWRAP_DATA = `0x2e1a7d4d${'de0b6b3a7640000'.padStart(64, '0')}`;

const mockTx = ({
    symbol = 'eth',
    methodId,
    to = WETH_ADDRESS_CHECKSUMMED,
    data,
}: {
    symbol?: string;
    methodId: string;
    to?: string;
    data?: string;
}) =>
    ({
        symbol,
        targets: [{ addresses: [to] }],
        ethereumSpecific: { parsedData: { methodId }, data },
    }) as unknown as WalletAccountTransaction;

describe('isWrapNativeTx', () => {
    it('detects a WETH deposit() to the canonical contract regardless of case', () => {
        expect(isWrapNativeTx(mockTx({ methodId: '0xD0E30DB0' }))).toBe(true);
    });

    it('rejects the deposit selector sent to a different contract', () => {
        expect(
            isWrapNativeTx(
                mockTx({
                    methodId: '0xd0e30db0',
                    to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                }),
            ),
        ).toBe(false);
    });

    it('rejects networks without a wrapped native token', () => {
        expect(isWrapNativeTx(mockTx({ symbol: 'pol', methodId: '0xd0e30db0' }))).toBe(false);
    });

    it('rejects other methods on the WETH contract', () => {
        expect(isWrapNativeTx(mockTx({ methodId: '0xa9059cbb' }))).toBe(false);
    });
});

describe('isUnwrapNativeTx', () => {
    it('detects a WETH withdraw(wad) to the canonical contract', () => {
        expect(isUnwrapNativeTx(mockTx({ methodId: '0x2e1a7d4d' }))).toBe(true);
    });

    it('rejects the withdraw selector sent to a different contract', () => {
        expect(
            isUnwrapNativeTx(
                mockTx({
                    methodId: '0x2e1a7d4d',
                    to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                }),
            ),
        ).toBe(false);
    });
});

describe('getUnwrapAmountByEthereumDataHex', () => {
    it('decodes the wad argument in wei', () => {
        expect(getUnwrapAmountByEthereumDataHex(UNWRAP_DATA)).toBe('1000000000000000000');
    });

    it('returns null for a different method', () => {
        expect(getUnwrapAmountByEthereumDataHex('0xd0e30db0')).toBeNull();
    });

    it('returns null for truncated calldata', () => {
        expect(getUnwrapAmountByEthereumDataHex('0x2e1a7d4d00ff')).toBeNull();
    });

    it('returns null for missing calldata', () => {
        expect(getUnwrapAmountByEthereumDataHex(undefined)).toBeNull();
    });
});
