import { toTokenAddress } from '@suite-common/tokens';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { selectTokenByNetworkAndContract } from './tokenMetadataSelectors';

describe('selectTokenByNetworkAndContract', () => {
    it('returns the first original token across equivalent EVM addresses and accounts', () => {
        const network = asNetworkSymbol('eth');
        const contract = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
        const first = Object.freeze(mockAccountToken({ contract, name: 'First' }));
        const second = mockAccountToken({
            contract: toTokenAddress(contract.toLowerCase()),
            name: 'Second',
        });
        const state: AccountsRootState = {
            wallet: {
                accounts: [
                    mockWalletAccount({ symbol: network, tokens: [first, second] }),
                    mockWalletAccount({ symbol: network, tokens: [second] }),
                ],
            },
        };

        expect(
            selectTokenByNetworkAndContract(state, network, toTokenAddress(contract.toLowerCase())),
        ).toBe(first);
        expect(first.contract).toBe(contract);
    });

    it('keeps networks and case-sensitive token identifiers separate', () => {
        const sol = asNetworkSymbol('sol');
        const eth = asNetworkSymbol('eth');
        const contract = toTokenAddress('MintCaseSensitive');
        const solToken = mockAccountToken({ contract });
        const ethToken = mockAccountToken({ contract });
        const state: AccountsRootState = {
            wallet: {
                accounts: [
                    mockWalletAccount({ symbol: sol, tokens: [solToken] }),
                    mockWalletAccount({ symbol: eth, tokens: [ethToken] }),
                ],
            },
        };

        expect(selectTokenByNetworkAndContract(state, sol, contract)).toBe(solToken);
        expect(selectTokenByNetworkAndContract(state, eth, contract)).toBe(ethToken);
        expect(
            selectTokenByNetworkAndContract(state, sol, toTokenAddress(contract.toLowerCase())),
        ).toBeNull();
    });
});
