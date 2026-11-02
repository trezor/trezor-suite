import { encodeFunctionData, parseAbi } from 'viem';

import { ONEINCH_FIXTURES as FIXTURES } from './__fixtures__/oneInchClearSigning';
import { NATIVE_CURRENCY, decodeClearSignedSwap } from './clearSigningSwap';

// Real mainnet calldata from trezor-firmware/common/tests/fixtures/ethereum/sign_tx_clear_signing.json

const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ETH_UNOSWAP_VALUE = 0x71afd498d0000n;

describe(decodeClearSignedSwap.name, () => {
    describe('1inch swap (full)', () => {
        it('decodes both legs from real calldata', () => {
            expect(decodeClearSignedSwap(FIXTURES.swap)).toEqual({
                send: {
                    token: '0xf0db65d17e30a966c2ae6a21f6bba71cea6e9754',
                    amount: 0x71003fa9d87dc20000n,
                },
                receive: {
                    token: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
                    amount: 0x2de741n,
                },
            });
        });

        it('maps a native-currency sentinel src token to NATIVE_CURRENCY', () => {
            const abi = parseAbi([
                'function swap(address executor, (address srcToken, address dstToken, address srcReceiver, address dstReceiver, uint256 amount, uint256 minReturnAmount, uint256 flags) desc, bytes data)',
            ]);
            const data = encodeFunctionData({
                abi,
                functionName: 'swap',
                args: [
                    WETH,
                    {
                        srcToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        dstToken: WETH,
                        srcReceiver: WETH,
                        dstReceiver: WETH,
                        amount: 1n,
                        minReturnAmount: 2n,
                        flags: 0n,
                    },
                    '0x',
                ],
            });

            expect(decodeClearSignedSwap(data)?.send.token).toBe(NATIVE_CURRENCY);
        });
    });

    describe('1inch unoswap family (partial, token-in-calldata)', () => {
        it('unoswap: decodes send leg from real calldata, omits receive', () => {
            expect(decodeClearSignedSwap(FIXTURES.unoswap)).toEqual({
                send: { token: WETH, amount: 0x016345785d8a0000n }, // 0.1 WETH
            });
        });

        it.each(['unoswapTo', 'unoswap2', 'unoswap3', 'unoswapTo2', 'unoswapTo3'] as const)(
            '%s: decodes a positive send leg with a valid token and no receive',
            name => {
                const decoded = decodeClearSignedSwap(FIXTURES[name]);
                expect(decoded?.receive).toBeUndefined();
                expect(decoded?.send.amount).toBeGreaterThan(0n);
                expect(decoded?.send.token).toMatch(/^0x[0-9a-f]{40}$/);
            },
        );
    });

    describe('1inch ethUnoswap family (partial, native send from tx value)', () => {
        it.each([
            'ethUnoswap',
            'ethUnoswap2',
            'ethUnoswap3',
            'ethUnoswapTo',
            'ethUnoswapTo2',
            'ethUnoswapTo3',
        ] as const)('%s: send leg is the tx value in native currency', name => {
            expect(decodeClearSignedSwap(FIXTURES[name], ETH_UNOSWAP_VALUE)).toEqual({
                send: { token: NATIVE_CURRENCY, amount: ETH_UNOSWAP_VALUE },
            });
        });

        it('returns null when tx value is missing for a native-spending selector', () => {
            expect(decodeClearSignedSwap(FIXTURES.ethUnoswap)).toBeNull();
        });
    });

    describe('non-swap calldata', () => {
        it('returns null for an unknown selector', () => {
            expect(decodeClearSignedSwap('0xdeadbeef00000000')).toBeNull();
        });

        it('returns null for empty or too-short data', () => {
            expect(decodeClearSignedSwap(undefined)).toBeNull();
            expect(decodeClearSignedSwap('0x')).toBeNull();
            expect(decodeClearSignedSwap('0x07ed')).toBeNull();
        });

        it('returns null when decoding malformed calldata for a known selector', () => {
            expect(decodeClearSignedSwap('0x07ed2379dead')).toBeNull();
        });

        it('returns null over the 6 KB firmware limit even for valid swap calldata', () => {
            const padded = FIXTURES.swap + '00'.repeat(6200 - (FIXTURES.swap.length - 2) / 2);
            expect(decodeClearSignedSwap(padded)).toBeNull();
        });
    });
});
