import type { TokenInfo, TokenTransfer } from '@trezor/blockchain-link-types';

import { getContractAddressForNetworkSymbolFixtures } from './__fixtures__/tokenUtils';
import {
    getAssetLogoContractAddresses,
    getContractAddressForNetworkSymbol,
    getErc4626Contracts,
    isTokenTransferMatchesSearch,
    isWrappedNativeToken,
    sortTokensByName,
} from './tokenUtils';

describe('isTokenTransferMatchesSearch', () => {
    const usdt = {
        type: 'sent',
        contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        amount: '100',
    } as TokenTransfer;

    it('matches token name by word prefix', () => {
        expect(isTokenTransferMatchesSearch(usdt, 'teth')).toBe(true);
        expect(isTokenTransferMatchesSearch(usdt, 'usd')).toBe(true);
    });

    it('does not match token name by word infix', () => {
        expect(isTokenTransferMatchesSearch(usdt, 'eth')).toBe(false);
    });

    it('matches token symbol and contract by substring', () => {
        expect(isTokenTransferMatchesSearch(usdt, 'sdt')).toBe(true);
        expect(isTokenTransferMatchesSearch(usdt, 'dac17f')).toBe(true);
    });
});

describe('getContractAddressForNetworkSymbol', () => {
    getContractAddressForNetworkSymbolFixtures.forEach(
        ({ testName, symbol, contractAddress, expected }) => {
            test(testName, () => {
                const result = getContractAddressForNetworkSymbol(symbol, contractAddress);
                expect(result).toBe(expected);
            });
        },
    );
});

describe('isWrappedNativeToken', () => {
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    it('matches the wrapped native token regardless of case', () => {
        expect(isWrappedNativeToken('eth', WETH)).toBe(true);
        expect(isWrappedNativeToken('eth', WETH.toLowerCase())).toBe(true);
    });

    it('does not match a different token', () => {
        expect(isWrappedNativeToken('eth', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBe(
            false,
        );
    });

    it('does not match on a network without a wrapped native token', () => {
        expect(isWrappedNativeToken('btc', WETH)).toBe(false);
    });

    it('returns false for a missing address', () => {
        expect(isWrappedNativeToken('eth', null)).toBe(false);
        expect(isWrappedNativeToken('eth', undefined)).toBe(false);
    });
});

describe('getAssetLogoContractAddresses', () => {
    it('returns [policyId, contract] for ada', async () => {
        const policyId = 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc535';
        const contract = `${policyId}41474958`;
        await expect(getAssetLogoContractAddresses('ada', contract)).resolves.toEqual([
            policyId,
            contract,
        ]);
    });

    it('returns [sacId, contract] for xlm', async () => {
        const classic = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
        const expectedSACId = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
        await expect(getAssetLogoContractAddresses('xlm', classic)).resolves.toEqual([
            classic,
            expectedSACId,
        ]);
    });

    it('returns [contract] for eth', async () => {
        const contract = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        await expect(getAssetLogoContractAddresses('eth', contract)).resolves.toEqual([
            contract.toLowerCase(),
        ]);
    });
});

describe('getErc4626Contracts', () => {
    const vaultToken: TokenInfo = {
        standard: 'ERC20',
        contract: '0xVault',
        decimals: 6,
        protocols: ['erc4626'],
    };

    const plainToken: TokenInfo = {
        standard: 'ERC20',
        contract: '0xPlain',
        decimals: 6,
    };

    it('returns normalized contracts of ERC4626 tokens', () => {
        expect(getErc4626Contracts([plainToken, vaultToken])).toEqual(new Set(['0xvault']));
    });

    it('returns an empty set when tokens are undefined', () => {
        expect(getErc4626Contracts(undefined)).toEqual(new Set());
    });
});

describe('sortTokensByName', () => {
    it('sorts tokens alphabetically by name regardless of case', () => {
        const tokens = [
            { name: 'Tether USD' },
            { name: 'chainlink' },
            { name: 'Aave' },
            { name: 'USD Coin' },
        ];

        expect([...tokens].sort(sortTokensByName).map(token => token.name)).toEqual([
            'Aave',
            'chainlink',
            'Tether USD',
            'USD Coin',
        ]);
    });

    it('places tokens without a name first', () => {
        const tokens = [{ name: 'Aave' }, { name: undefined }, { name: 'chainlink' }];

        expect([...tokens].sort(sortTokensByName).map(token => token.name)).toEqual([
            undefined,
            'Aave',
            'chainlink',
        ]);
    });
});
