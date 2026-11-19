/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import {
    createTestCompositionRoot,
    renderHookWithStoreProvider,
    testMocks,
} from '@suite-common/test-utils';
import { toTokenAddress } from '@suite-common/tokens';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { TransactionTokenMetadataProvider } from './TransactionTokenMetadataProvider';
import { useTokenMetadata } from './useTokenMetadata';

const networkSymbol = asNetworkSymbol('sol');
const contract = toTokenAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const transaction = testMocks.getWalletTransaction({
    symbol: networkSymbol,
    tokens: [
        {
            type: 'recv',
            standard: 'SPL',
            amount: '1',
            from: 'sender',
            to: 'recipient',
            contract,
            name: 'USD Coin',
            symbol: 'usdc',
            decimals: 6,
        },
    ],
});

const TransactionWrapper = ({ children }: PropsWithChildren) => (
    <TransactionTokenMetadataProvider transaction={transaction}>
        {children}
    </TransactionTokenMetadataProvider>
);

describe('TransactionTokenMetadataProvider', () => {
    it('provides a transferred token missing from the accounts', () => {
        const { services } = createTestCompositionRoot<void, AccountsRootState>({
            preloadedState: { wallet: { accounts: [] } },
        });
        const { result } = renderHookWithStoreProvider(
            () => useTokenMetadata(networkSymbol, contract),
            { services, wrapper: TransactionWrapper },
        );

        expect(result.current).toEqual({
            contract,
            name: 'USD Coin',
            symbol: 'usdc',
            decimals: 6,
            standard: 'SPL',
        });
    });
});
