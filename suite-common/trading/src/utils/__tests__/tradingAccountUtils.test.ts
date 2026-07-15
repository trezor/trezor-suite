import { type CryptoId } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { isAccountEligibleForTrade, pickFallbackAccount } from '../tradingAccountUtils';

const TOKEN_CRYPTO_ID = 'ethereum--0xTokenContract' as CryptoId;

const withBalance = mockWalletAccount({ symbol: 'eth', balance: '1000000000000000000' });
const zeroBalance = mockWalletAccount({ symbol: 'eth', balance: '0', tokens: [] });

describe('isAccountEligibleForTrade', () => {
    it('is always eligible for buy regardless of balance', () => {
        expect(isAccountEligibleForTrade(zeroBalance, 'buy', {})).toBe(true);
    });

    it('is eligible for sell when the native balance is positive', () => {
        expect(isAccountEligibleForTrade(withBalance, 'sell', {})).toBe(true);
    });

    it('is not eligible for sell when there is no balance and no tokens', () => {
        expect(isAccountEligibleForTrade(zeroBalance, 'sell', {})).toBe(false);
    });

    it('is not eligible for a token cryptoId when the account holds no matching token', () => {
        expect(isAccountEligibleForTrade(zeroBalance, 'sell', {}, TOKEN_CRYPTO_ID)).toBe(false);
    });
});

describe('pickFallbackAccount', () => {
    it('returns the first eligible account', () => {
        const accounts: Account[] = [zeroBalance, withBalance];

        expect(pickFallbackAccount(accounts, 'sell', {}).key).toBe(withBalance.key);
    });

    it('returns the first account as a last resort when none are eligible', () => {
        const accounts: Account[] = [zeroBalance];

        expect(pickFallbackAccount(accounts, 'sell', {}).key).toBe(zeroBalance.key);
    });

    it('returns undefined when there are no accounts at all', () => {
        expect(pickFallbackAccount([], 'sell', {})).toBeUndefined();
    });
});
