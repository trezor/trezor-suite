/**
 * @jest-environment jsdom
 */
import { type PropsWithChildren } from 'react';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { toTokenAddress } from '@suite-common/tokens';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { TokenMetadataProvider } from './TokenMetadataProvider';
import { useTokenMetadata } from './useTokenMetadata';

const networkSymbol = asNetworkSymbol('eth');
const contract = toTokenAddress('0x0000000000000000000000000000000000000001');
const accountToken = mockAccountToken({ contract, name: 'Stored token', symbol: 'STORE' });
const state: AccountsRootState = {
    wallet: {
        accounts: [mockWalletAccount({ symbol: networkSymbol, tokens: [accountToken] })],
    },
};

const MetadataWrapper = ({ children }: PropsWithChildren) => (
    <TokenMetadataProvider sources={[{ networkSymbol, tokens: [{ contract, symbol: 'SOURCE' }] }]}>
        {children}
    </TokenMetadataProvider>
);

describe('useTokenMetadata', () => {
    it('falls back to the account store without a metadata provider', () => {
        const { services } = createTestCompositionRoot<void, AccountsRootState>({
            preloadedState: state,
        });
        const { result } = renderHookWithStoreProvider(
            () => useTokenMetadata(networkSymbol, contract),
            { services },
        );

        expect(result.current).toEqual(accountToken);
    });

    it('uses context metadata instead of the account entry, including for missing fields', () => {
        const { services } = createTestCompositionRoot<void, AccountsRootState>({
            preloadedState: state,
        });
        const { result } = renderHookWithStoreProvider(
            () => useTokenMetadata(networkSymbol, contract),
            { services, wrapper: MetadataWrapper },
        );

        expect(result.current).toMatchObject({ contract, symbol: 'SOURCE' });
        expect(result.current?.name).toBeUndefined();
        expect(result.current?.decimals).toBeUndefined();
    });

    it.each([undefined, toTokenAddress('0x0000000000000000000000000000000000000002')])(
        'returns null for an absent or unknown contract (%s)',
        contractAddress => {
            const { services } = createTestCompositionRoot<void, AccountsRootState>({
                preloadedState: state,
            });
            const { result } = renderHookWithStoreProvider(
                () => useTokenMetadata(networkSymbol, contractAddress),
                { services },
            );

            expect(result.current).toBeNull();
        },
    );
});
