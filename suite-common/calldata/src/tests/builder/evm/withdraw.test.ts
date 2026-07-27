import { BigNumber } from '@trezor/utils';

import { buildWithdraw } from '../../../builder/evm/withdraw';
import { asEvmAddress } from '../../../types/evm';

const SENDER = asEvmAddress('0x22E228AdE324185123A54Ad25F3459a99CF51E7a');

describe('buildWithdraw', () => {
    it('encodes valid withdraw calldata', () => {
        const result = buildWithdraw(
            {
                assets: new BigNumber('1507906'),
                receiver: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
                owner: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xb460af94000000000000000000000000000000000000000000000000000000000017024200000000000000000000000022e228ade324185123a54ad25f3459a99cf51e7a00000000000000000000000022e228ade324185123a54ad25f3459a99cf51e7a',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for zero address receiver', () => {
        const result = buildWithdraw(
            {
                assets: new BigNumber('1507906'),
                receiver: '0x0000000000000000000000000000000000000000',
                owner: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'ZERO_ADDRESS', path: 'receiver', severity: 'error' },
            { code: 'NOT_SAME_AS_SENDER', path: 'receiver', severity: 'error' },
        ]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for zero address owner', () => {
        const result = buildWithdraw(
            {
                assets: new BigNumber('1507906'),
                receiver: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
                owner: '0x0000000000000000000000000000000000000000',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'ZERO_ADDRESS', path: 'owner', severity: 'error' },
            { code: 'NOT_SAME_AS_SENDER', path: 'owner', severity: 'error' },
        ]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error when receiver is different from sender', () => {
        const result = buildWithdraw(
            {
                assets: new BigNumber('1507906'),
                receiver: '0x1111111111111111111111111111111111111111',
                owner: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'receiver', severity: 'error' },
        ]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error when owner is different from sender', () => {
        const result = buildWithdraw(
            {
                assets: new BigNumber('1507906'),
                receiver: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
                owner: '0x1111111111111111111111111111111111111111',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([
            { code: 'NOT_SAME_AS_SENDER', path: 'owner', severity: 'error' },
        ]);
        expect(result.warnings).toEqual([]);
    });

    it('returns error for zero assets', () => {
        const result = buildWithdraw(
            {
                assets: new BigNumber('0'),
                receiver: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
                owner: '0x22E228AdE324185123A54Ad25F3459a99CF51E7a',
            },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([{ code: 'ZERO_AMOUNT', path: 'assets', severity: 'error' }]);
        expect(result.warnings).toEqual([]);
    });
});
