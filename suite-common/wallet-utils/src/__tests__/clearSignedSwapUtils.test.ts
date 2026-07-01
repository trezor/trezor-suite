import { getClearSignedSwapAmounts } from '../clearSignedSwapUtils';

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

// 1inch swap, 1 USDC -> 0.03008321 WBTC.
const SWAP_USDC_WBTC =
    '0x07ed2379000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000002de741000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000000';

const UNOSWAP_WETH_01 =
    '0x83800a8e000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000017cff16da2c808f348e280000000000000000000000d3e9895230e8fb1460852f6cda3c4b926fbc29d8fb39cfb5';
const ETH_UNOSWAP =
    '0xa76dfc3b00000000000000000000000000000000000000000000000000068ea41a18d0d020800000000000000000000004708077eca6bb527a5bbbd6358ffb043a9c1c14d1f115cb';

describe(getClearSignedSwapAmounts.name, () => {
    describe('full swap', () => {
        it('formats both legs with the matched tokens decimals', () => {
            expect(
                getClearSignedSwapAmounts({
                    transactionData: SWAP_USDC_WBTC,
                    send: { contractAddress: USDC, decimals: 6 },
                    receive: { contractAddress: WBTC, decimals: 8 },
                }),
            ).toEqual({ sendAmount: '1', receiveAmount: '0.03008321' });
        });

        it('omits the receive amount when the decoded token does not match the resolved token', () => {
            const result = getClearSignedSwapAmounts({
                transactionData: SWAP_USDC_WBTC,
                send: { contractAddress: USDC, decimals: 6 },
                receive: { contractAddress: WETH, decimals: 18 },
            });

            expect(result?.sendAmount).toBe('1');
            expect(result?.receiveAmount).toBeUndefined();
        });

        it('returns undefined when no leg matches (resolved native vs ERC-20 calldata token)', () => {
            expect(
                getClearSignedSwapAmounts({
                    transactionData: SWAP_USDC_WBTC,
                    send: { decimals: 18 },
                }),
            ).toBeUndefined();
        });
    });

    describe('partial swap', () => {
        it('formats the send leg only (unoswap), never a receive amount', () => {
            expect(
                getClearSignedSwapAmounts({
                    transactionData: UNOSWAP_WETH_01,
                    send: { contractAddress: WETH, decimals: 18 },
                    receive: { contractAddress: WETH, decimals: 18 },
                }),
            ).toEqual({ sendAmount: '0.1', receiveAmount: undefined });
        });

        it('formats a native send leg from tx value (ethUnoswap)', () => {
            expect(
                getClearSignedSwapAmounts({
                    transactionData: ETH_UNOSWAP,
                    value: 0x71afd498d0000n, // 0.002 ETH
                    send: { decimals: 18 },
                }),
            ).toEqual({ sendAmount: '0.002', receiveAmount: undefined });
        });
    });

    describe('invalid decimals are never rendered as a wrong amount', () => {
        it.each([
            ['NaN', NaN],
            ['negative', -6],
            ['fractional', 6.5],
        ])(
            'returns undefined send amount for %s decimals (no throw, no NaN)',
            (_label, decimals) => {
                const result = getClearSignedSwapAmounts({
                    transactionData: SWAP_USDC_WBTC,
                    send: { contractAddress: USDC, decimals },
                    receive: { contractAddress: WBTC, decimals: 8 },
                });

                expect(result?.sendAmount).toBeUndefined();
            },
        );

        it('returns undefined rather than "0" when decimals underflow a nonzero amount', () => {
            expect(
                getClearSignedSwapAmounts({
                    transactionData: SWAP_USDC_WBTC,
                    send: { contractAddress: USDC, decimals: 30 },
                })?.sendAmount,
            ).toBeUndefined();
        });
    });

    describe('non-swap', () => {
        it('returns undefined for non-clear-signed calldata', () => {
            expect(
                getClearSignedSwapAmounts({
                    transactionData: '0xdeadbeef',
                    send: { contractAddress: USDC, decimals: 6 },
                }),
            ).toBeUndefined();
        });
    });
});
