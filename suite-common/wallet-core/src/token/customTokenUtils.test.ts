import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import { type TokenInfo } from '@trezor/connect';

import { getCustomTokenInputError, isSupportedCustomToken } from './customTokenUtils';

const contract = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const symbol = asNetworkSymbol('eth');
const isAddressValid = (address: string) => /^0x[0-9a-fA-F]{40}$/.test(address);

const blockbook = { backendType: 'blockbook' } as const;
const directRpc = { backendType: 'evm-rpc' } as const;

const token = (overrides: Partial<TokenInfo> = {}): TokenInfo => ({
    standard: 'ERC20',
    contract,
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    balance: '0',
    ...overrides,
});

describe(getCustomTokenInputError.name, () => {
    it('rejects an invalid address', () => {
        expect(
            getCustomTokenInputError({
                contract: '0x123',
                account: { symbol, tokens: [] },
                hiddenTokens: [],
                isAddressValid,
            }),
        ).toBe('invalid-address');
    });

    it('rejects a token the account already shows, in any casing', () => {
        expect(
            getCustomTokenInputError({
                contract,
                account: {
                    symbol,
                    tokens: [mockAccountToken({ contract: contract.toLowerCase() })],
                },
                hiddenTokens: [],
                isAddressValid,
            }),
        ).toBe('already-added');
    });

    it('accepts a token the account lists but hides', () => {
        const listedToken = mockAccountToken({ contract: contract.toLowerCase() });

        expect(
            getCustomTokenInputError({
                contract,
                account: { symbol, tokens: [listedToken] },
                hiddenTokens: [listedToken],
                isAddressValid,
            }),
        ).toBeUndefined();
    });

    it('accepts a valid new contract', () => {
        expect(
            getCustomTokenInputError({
                contract,
                account: { symbol, tokens: undefined },
                hiddenTokens: [],
                isAddressValid,
            }),
        ).toBeUndefined();
    });
});

describe(isSupportedCustomToken.name, () => {
    it.each([
        ['an ERC-20 token', token(), true],
        ['a token with zero decimals', token({ decimals: 0 }), true],
        [
            'a non-token, echoed by address',
            token({ name: contract.toLowerCase(), symbol: '' }),
            false,
        ],
        ['an ERC-1155 contract', token({ standard: 'ERC1155' }), false],
        ['an ERC-721 collection', token({ standard: 'ERC721' }), false],
    ])('Blockbook: %s → %s', (_, input, expected) => {
        expect(isSupportedCustomToken(input, blockbook)).toBe(expected);
    });

    it.each([
        ['an ERC-20 token', token(), true],
        [
            'a non-token with unreadable metadata',
            token({ name: 'unknown', symbol: 'unknown' }),
            false,
        ],
        ['an ERC-1155 contract', token({ standard: 'ERC1155' }), false],
    ])('direct RPC: %s → %s', (_, input, expected) => {
        expect(isSupportedCustomToken(input, directRpc)).toBe(expected);
    });
});
