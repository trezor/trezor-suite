import { type Coins, type CryptoId } from 'invity-api';

import coins from '../../__fixtures__/coins.json';
import { createTradingTestState, renderHookWithTradingStore } from '../../__tests__/testUtils';
import { useTradingAssets } from '../useTradingAssets';

const AUSDC_CONTRACT = '0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c';
const UNKNOWN_TOKEN_CONTRACT = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

const renderHook = (preloadedCoins: Coins | null = coins as Coins) =>
    renderHookWithTradingStore(() => useTradingAssets(), {
        preloadedState: createTradingTestState({
            info: {
                coins: preloadedCoins ?? undefined,
                platforms: undefined,
                paymentMethods: [],
            },
        }),
    });

describe('resolveAssetTokenOption', () => {
    it('uses invity symbol when token is known to invity', () => {
        const { result } = renderHook();

        const option = result.current.resolveAssetTokenOption('eth', {
            contract: AUSDC_CONTRACT,
            symbol: 'aEthUSDC',
            name: 'Aave Ethereum USDC',
        });

        expect(option.symbol).toBe('ausdc');
        expect(option.displaySymbol).toBe('AUSDC');
        expect(option.name).toBe('aEthUSDC');
        expect(option.contractAddress).toBe(AUSDC_CONTRACT);
        expect(option.networkSymbol).toBe('eth');
        expect(option.isNativeToken).toBe(false);
    });

    it('falls back to blockbook symbol when token is unknown to invity', () => {
        const { result } = renderHook();

        const option = result.current.resolveAssetTokenOption('eth', {
            contract: UNKNOWN_TOKEN_CONTRACT,
            symbol: 'aEthUSDC',
            name: 'Aave Ethereum USDC',
        });

        expect(option.symbol).toBe('aEthUSDC');
        expect(option.displaySymbol).toBe('aEthUSDC');
        expect(option.contractAddress).toBe(UNKNOWN_TOKEN_CONTRACT);
        expect(option.networkSymbol).toBe('eth');
        expect(option.isNativeToken).toBe(false);
    });

    it('falls back to blockbook symbol when invity coins are not loaded', () => {
        const { result } = renderHook(null);

        const option = result.current.resolveAssetTokenOption('eth', {
            contract: AUSDC_CONTRACT,
            symbol: 'aEthUSDC',
            name: 'Aave Ethereum USDC',
        });

        expect(option.symbol).toBe('aEthUSDC');
        expect(option.contractAddress).toBe(AUSDC_CONTRACT);
    });

    it('returns consistent cryptoId regardless of symbol source', () => {
        const { result } = renderHook();

        const cryptoId = `ethereum--${AUSDC_CONTRACT}` as CryptoId;

        const optionWithInvity = result.current.resolveAssetTokenOption('eth', {
            contract: AUSDC_CONTRACT,
            symbol: 'aEthUSDC',
            name: 'Aave Ethereum USDC',
        });

        expect(optionWithInvity.id).toBe(cryptoId);
    });
});
