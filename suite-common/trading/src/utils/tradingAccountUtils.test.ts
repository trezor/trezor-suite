import { type CryptoId } from 'invity-api';

import { mockNetworkConfigDeps } from '@suite-common/wallet-config/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { isAccountEligibleForTrade } from './tradingAccountUtils';

const TOKEN_CRYPTO_ID = 'ethereum--0xTokenContract' as CryptoId;

const withBalance = mockWalletAccount({ symbol: 'eth', balance: '1000000000000000000' });
const zeroBalance = mockWalletAccount({ symbol: 'eth', balance: '0', tokens: [] });

describe('isAccountEligibleForTrade', () => {
    it('is always eligible for buy regardless of balance', () => {
        expect(isAccountEligibleForTrade(mockNetworkConfigDeps, zeroBalance, 'buy', {})).toBe(true);
    });

    it('is eligible for sell when the native balance is positive', () => {
        expect(isAccountEligibleForTrade(mockNetworkConfigDeps, withBalance, 'sell', {})).toBe(
            true,
        );
    });

    it('is not eligible for sell when there is no balance and no tokens', () => {
        expect(isAccountEligibleForTrade(mockNetworkConfigDeps, zeroBalance, 'sell', {})).toBe(
            false,
        );
    });

    it('is not eligible for a token cryptoId when the account holds no matching token', () => {
        expect(
            isAccountEligibleForTrade(
                mockNetworkConfigDeps,
                zeroBalance,
                'sell',
                {},
                TOKEN_CRYPTO_ID,
            ),
        ).toBe(false);
    });
});
