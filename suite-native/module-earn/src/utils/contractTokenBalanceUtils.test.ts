import { WRAPPED_NATIVE, asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getUntrackedWrappedNativeTokenInfo } from './contractTokenBalanceUtils';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

const WETH = WRAPPED_NATIVE.eth!;
const USDC_ADDRESS = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

describe(getUntrackedWrappedNativeTokenInfo.name, () => {
    it('returns WETH TokenInfo for an eth account with no tokens', () => {
        const account = mockWalletAccount({ symbol: ethSymbol, tokens: [] });

        expect(getUntrackedWrappedNativeTokenInfo(account)).toEqual({
            standard: 'ERC20',
            contract: WETH.address,
            symbol: WETH.symbol,
            name: WETH.symbol,
            decimals: WETH.decimals,
            balance: '0',
        });
    });

    it('returns null when the wrapped native token is already tracked', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            tokens: [mockAccountToken({ contract: toTokenAddress(WETH.address) })],
        });

        expect(getUntrackedWrappedNativeTokenInfo(account)).toBeNull();
    });

    it('returns null when the tracked contract address differs only by case', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            tokens: [mockAccountToken({ contract: toTokenAddress(WETH.address.toLowerCase()) })],
        });

        expect(getUntrackedWrappedNativeTokenInfo(account)).toBeNull();
    });

    it('returns null for a network without a wrapped native token', () => {
        const account = mockWalletAccount({ symbol: btcSymbol, tokens: [] });

        expect(getUntrackedWrappedNativeTokenInfo(account)).toBeNull();
    });

    it('ignores unrelated tracked tokens and still returns the wrapped native token', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            tokens: [mockAccountToken({ contract: USDC_ADDRESS, symbol: 'USDC' })],
        });

        expect(getUntrackedWrappedNativeTokenInfo(account)).toEqual({
            standard: 'ERC20',
            contract: WETH.address,
            symbol: WETH.symbol,
            name: WETH.symbol,
            decimals: WETH.decimals,
            balance: '0',
        });
    });
});
