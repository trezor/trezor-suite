import { type Coins, type CryptoId } from 'invity-api';

import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';

import { resolveAssetTokenOption } from './tradingAssets';
import coins from '../__fixtures__/coins.json';

const AUSDC_CONTRACT = '0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c';
const UNKNOWN_TOKEN_CONTRACT = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
const ethSymbol = toNetworkSymbolNonTestnet('eth');

const resolveToken = (
    token: Parameters<typeof resolveAssetTokenOption>[0]['token'],
    loadedCoins: Coins | null = coins as Coins,
) =>
    resolveAssetTokenOption({
        coins: loadedCoins ?? undefined,
        networkSymbol: ethSymbol,
        platforms: undefined,
        token,
    });

describe('resolveAssetTokenOption', () => {
    it('uses invity symbol when token is known to invity', () => {
        const option = resolveToken({
            contract: AUSDC_CONTRACT,
            symbol: 'aEthUSDC',
            name: 'Aave Ethereum USDC',
        });

        expect(option.symbol).toBe('ausdc');
        expect(option.displaySymbol).toBe('AUSDC');
        expect(option.name).toBe('aEthUSDC');
        expect(option.displaySymbolName).toBe('aEthUSDC');
        expect(option.contractAddress).toBe(AUSDC_CONTRACT);
        expect(option.networkSymbol).toBe('eth');
        expect(option.isNativeToken).toBe(false);
    });

    it('falls back to blockbook symbol when token is unknown to invity', () => {
        const option = resolveToken({
            contract: UNKNOWN_TOKEN_CONTRACT,
            symbol: 'aEthUSDC',
            name: 'Aave Ethereum USDC',
        });

        expect(option.symbol).toBe('aEthUSDC');
        expect(option.displaySymbol).toBe('aEthUSDC');
        expect(option.displaySymbolName).toBe('Aave Ethereum USDC');
        expect(option.contractAddress).toBe(UNKNOWN_TOKEN_CONTRACT);
        expect(option.networkSymbol).toBe('eth');
        expect(option.isNativeToken).toBe(false);
    });

    it('falls back to blockbook symbol when invity coins are not loaded', () => {
        const option = resolveToken(
            {
                contract: AUSDC_CONTRACT,
                symbol: 'aEthUSDC',
                name: 'Aave Ethereum USDC',
            },
            null,
        );

        expect(option.symbol).toBe('aEthUSDC');
        expect(option.contractAddress).toBe(AUSDC_CONTRACT);
    });

    it('returns consistent cryptoId regardless of symbol source', () => {
        const cryptoId = `ethereum--${AUSDC_CONTRACT}` as CryptoId;

        const optionWithInvity = resolveToken({
            contract: AUSDC_CONTRACT,
            symbol: 'aEthUSDC',
            name: 'Aave Ethereum USDC',
        });

        expect(optionWithInvity.id).toBe(cryptoId);
    });
});
