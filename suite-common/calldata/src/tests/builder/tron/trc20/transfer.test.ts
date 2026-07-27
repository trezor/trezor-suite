import { BigNumber } from '@trezor/utils';

import { buildTrc20Transfer } from '../../../../builder/tron/trc20/transfer';
import { asTronAddress } from '../../../../types/tron';

const SENDER = asTronAddress('TX5XiRXdyz7sdFwF5mnhT1QoGCpbkncpke');
const RECIPIENT = asTronAddress('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4');

describe('buildTrc20Transfer', () => {
    it('encodes valid transfer calldata', () => {
        const result = buildTrc20Transfer(
            { to: RECIPIENT, amount: new BigNumber('1000000') },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xa9059cbb000000000000000000000000689ac7d52363bedfae8d478f8fa80becc6d00b5900000000000000000000000000000000000000000000000000000000000f4240',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('returns SELF_ADDRESS warning for self-transfer', () => {
        const result = buildTrc20Transfer(
            { to: RECIPIENT, amount: new BigNumber('1000000') },
            { sender: RECIPIENT },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xa9059cbb000000000000000000000000689ac7d52363bedfae8d478f8fa80becc6d00b5900000000000000000000000000000000000000000000000000000000000f4240',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([
            { code: 'SELF_ADDRESS', path: 'to', severity: 'warning' },
        ]);
    });

    it('returns error for invalid address', () => {
        const result = buildTrc20Transfer(
            { to: 'not-a-tron-address', amount: new BigNumber('1000000') },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(false);
        expect(result.data).toBe(null);
        expect(result.errors).toEqual([{ code: 'INVALID_ADDRESS', path: 'to', severity: 'error' }]);
        expect(result.warnings).toEqual([]);
    });

    it('returns ZERO_AMOUNT warning for zero amount', () => {
        const result = buildTrc20Transfer(
            { to: RECIPIENT, amount: new BigNumber('0') },
            { sender: SENDER },
        );

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xa9059cbb000000000000000000000000689ac7d52363bedfae8d478f8fa80becc6d00b590000000000000000000000000000000000000000000000000000000000000000',
        );
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([
            { code: 'ZERO_AMOUNT', path: 'amount', severity: 'warning' },
        ]);
    });
});
