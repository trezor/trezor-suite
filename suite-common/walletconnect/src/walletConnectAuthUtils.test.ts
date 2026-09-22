import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    ethereumAccountRequiredError,
    getSessionAuthenticateContext,
} from './walletConnectAuthUtils';

describe(getSessionAuthenticateContext.name, () => {
    it.each([
        ['no accounts', []],
        ['only a Bitcoin account', [mockWalletAccount({ symbol: 'btc' })]],
        ['only a hidden Ethereum account', [mockWalletAccount({ symbol: 'eth', visible: false })]],
    ])('returns an explicit error for %s', (_, accounts) => {
        expect(getSessionAuthenticateContext(accounts)).toEqual({
            success: false,
            error: ethereumAccountRequiredError,
        });
    });

    it('returns the Ethereum account and namespace used for authentication', () => {
        const ethereumAccount = mockWalletAccount({ symbol: 'eth' });

        expect(getSessionAuthenticateContext([ethereumAccount])).toEqual({
            success: true,
            payload: {
                account: ethereumAccount,
                namespace: expect.objectContaining({
                    chains: ['eip155:1'],
                }),
            },
        });
    });
});
