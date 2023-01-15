import type { TokenTransfer } from '@trezor/blockchain-link';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';

import { getIsZeroValuePhishing } from '../antiFraud';

describe('antifraud utils', () => {
    test('detects potential zero-value phishing transactions', () => {
        expect(
            getIsZeroValuePhishing({
                amount: '0',
                tokens: [
                    {
                        amount: '0',
                    } as TokenTransfer,
                    {
                        amount: '0',
                    } as TokenTransfer,
                    {
                        amount: '0',
                    } as TokenTransfer,
                ],
            } as WalletAccountTransaction),
        ).toBe(true);
        expect(
            getIsZeroValuePhishing({
                amount: '0',
                tokens: [
                    {
                        amount: '0',
                    } as TokenTransfer,
                    {
                        amount: '0.00132342',
                    } as TokenTransfer,
                ],
            } as WalletAccountTransaction),
        ).toBe(false);
    });
});
