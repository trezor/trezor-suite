import { BigNumber } from '@trezor/utils';

import { buildRedeem } from '../../../builder/evm/redeem';
import { asEvmAddress } from '../../../types/evm';

const SENDER = asEvmAddress('0x44Ab691a7492C3dCb88241AF8aC5371d84B61BB6');

describe('buildRedeem', () => {
    it('encodes valid redeem calldata', () => {
        const result = buildRedeem(
            {
                shares: new BigNumber('9999586934321'),
                receiver: SENDER,
                owner: SENDER,
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xba0876520000000000000000000000000000000000000000000000000000091835d3be3100000000000000000000000044ab691a7492c3dcb88241af8ac5371d84b61bb600000000000000000000000044ab691a7492c3dcb88241af8ac5371d84b61bb6',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for zero address receiver', () => {
        const result = buildRedeem(
            {
                shares: new BigNumber('9999586934321'),
                receiver: '0x0000000000000000000000000000000000000000',
                owner: SENDER,
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'ZERO_ADDRESS', path: 'receiver', severity: 'error' },
            { code: 'NOT_SAME_AS_SENDER', path: 'receiver', severity: 'error' },
        ]);
    });

    it('returns error for zero address owner', () => {
        const result = buildRedeem(
            {
                shares: new BigNumber('9999586934321'),
                receiver: SENDER,
                owner: '0x0000000000000000000000000000000000000000',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'ZERO_ADDRESS', path: 'owner', severity: 'error' },
            { code: 'NOT_SAME_AS_SENDER', path: 'owner', severity: 'error' },
        ]);
    });

    it('returns error when receiver is different from sender', () => {
        const result = buildRedeem(
            {
                shares: new BigNumber('9999586934321'),
                receiver: '0x1111111111111111111111111111111111111111',
                owner: SENDER,
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'receiver', severity: 'error' },
        ]);
    });

    it('returns error when owner is different from sender', () => {
        const result = buildRedeem(
            {
                shares: new BigNumber('9999586934321'),
                receiver: SENDER,
                owner: '0x1111111111111111111111111111111111111111',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'owner', severity: 'error' },
        ]);
    });

    it('returns errors when owner and receiver are different from sender', () => {
        const result = buildRedeem(
            {
                shares: new BigNumber('9999586934321'),
                receiver: '0x1111111111111111111111111111111111111111',
                owner: '0x1111111111111111111111111111111111111111',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'receiver', severity: 'error' },
            { code: 'NOT_SAME_AS_SENDER', path: 'owner', severity: 'error' },
        ]);
    });

    it('returns error for zero shares', () => {
        const result = buildRedeem(
            {
                shares: new BigNumber('0'),
                receiver: SENDER,
                owner: SENDER,
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([{ code: 'ZERO_AMOUNT', path: 'shares', severity: 'error' }]);
    });
});
