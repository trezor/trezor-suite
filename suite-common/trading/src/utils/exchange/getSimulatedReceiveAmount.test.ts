import type { CryptoId } from 'invity-api';

import { type NetworkTxSimulationResult } from '@suite-common/tx-simulation';

import { getSimulatedReceiveAmount } from './getSimulatedReceiveAmount';

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const nativeAssetDiff = {
    asset_type: 'NATIVE',
    asset: { type: 'NATIVE', chain_id: 1, chain_name: 'ethereum', decimals: 18 },
    // 1 ETH
    in: [{ raw_value: '0xde0b6b3a7640000', value: '1' }],
    out: [],
};

const usdcAssetDiff = {
    asset_type: 'ERC20',
    asset: { type: 'ERC20', address: USDC_CONTRACT.toLowerCase(), decimals: 6 },
    // 250 USDC
    in: [{ raw_value: '0xee6b280', value: '250' }],
    out: [],
};

const createSimulationResult = (
    assetsDiffs: unknown[],
    { simulationStatus = 'Success' }: { simulationStatus?: 'Success' | 'Error' } = {},
): NetworkTxSimulationResult =>
    ({
        method: 'ethereumSignTransaction',
        payload: {
            needsDisclaimer: false,
            simulation: {
                status: simulationStatus,
                account_summary: { assets_diffs: assetsDiffs },
            },
        },
    }) as unknown as NetworkTxSimulationResult;

const sendQuote: CryptoId = `ethereum--${USDC_CONTRACT}` as CryptoId;
const nativeQuoteReceive: CryptoId = 'ethereum' as CryptoId;
const tokenQuoteReceive: CryptoId = `ethereum--${USDC_CONTRACT}` as CryptoId;

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const solQuoteReceive: CryptoId = 'solana' as CryptoId;
const splQuoteReceive: CryptoId = `solana--${USDC_MINT}` as CryptoId;

describe('getSimulatedReceiveAmount', () => {
    it('returns null without a simulation result', () => {
        expect(getSimulatedReceiveAmount(undefined, sendQuote, nativeQuoteReceive)).toBeNull();
    });

    it('returns null without a quote', () => {
        const result = createSimulationResult([nativeAssetDiff]);

        expect(getSimulatedReceiveAmount(result, sendQuote, undefined)).toBeNull();
    });

    it('returns null when the simulation errored', () => {
        const result = createSimulationResult([nativeAssetDiff], { simulationStatus: 'Error' });

        expect(getSimulatedReceiveAmount(result, sendQuote, nativeQuoteReceive)).toBeNull();
    });

    it('returns the incoming native amount for a native receive asset', () => {
        const result = createSimulationResult([usdcAssetDiff, nativeAssetDiff]);

        expect(getSimulatedReceiveAmount(result, sendQuote, nativeQuoteReceive)).toBe('1');
    });

    it('matches an ERC20 receive asset by contract address case-insensitively', () => {
        const result = createSimulationResult([nativeAssetDiff, usdcAssetDiff]);

        expect(getSimulatedReceiveAmount(result, sendQuote, tokenQuoteReceive)).toBe('250');
    });

    it('prefers exact raw_value math over the float-derived value', () => {
        // Real API sample: raw_value 0xed425 = 971813 subunits at 6 decimals
        // is exactly 0.971813, while `value` carries float noise.
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                in: [{ raw_value: '0xed425', value: '0.971813000000000038' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, sendQuote, tokenQuoteReceive)).toBe('0.971813');
    });

    it('sums multiple incoming transfers of the receive asset', () => {
        // 250 USDC + 50.5 USDC
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                in: [{ raw_value: '0xee6b280' }, { raw_value: '0x30291a0' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, sendQuote, tokenQuoteReceive)).toBe('300.5');
    });

    it('falls back to value when the asset decimals are unknown', () => {
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                asset: { type: 'NONERC', address: USDC_CONTRACT.toLowerCase() },
                in: [{ raw_value: '0xee6b280', value: '250' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, sendQuote, tokenQuoteReceive)).toBe('250');
    });

    it('returns null when the receive asset has no incoming transfer', () => {
        const result = createSimulationResult([{ ...nativeAssetDiff, in: [] }]);

        expect(getSimulatedReceiveAmount(result, sendQuote, nativeQuoteReceive)).toBeNull();
    });

    it('returns null when only other assets changed', () => {
        const result = createSimulationResult([usdcAssetDiff]);

        expect(getSimulatedReceiveAmount(result, sendQuote, nativeQuoteReceive)).toBeNull();
    });

    it('returns null when an incoming transfer cannot be valued', () => {
        const result = createSimulationResult([
            {
                ...usdcAssetDiff,
                asset: { type: 'NONERC', address: USDC_CONTRACT.toLowerCase() },
                in: [{ raw_value: '0xee6b280' }],
            },
        ]);

        expect(getSimulatedReceiveAmount(result, sendQuote, tokenQuoteReceive)).toBeNull();
    });

    describe('cross-chain (bridge) swaps', () => {
        const SOL_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const ACCOUNT = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
        const ethSend: CryptoId = 'ethereum' as CryptoId;
        const solReceive: CryptoId = 'solana' as CryptoId;
        const solUsdcReceive: CryptoId = `solana--${SOL_USDC_MINT}` as CryptoId;

        const createBridgeResult = (
            crossChainDiffs: unknown[],
            assetsDiffs: unknown[] = [],
        ): NetworkTxSimulationResult =>
            ({
                method: 'ethereumSignTransaction',
                payload: {
                    needsDisclaimer: false,
                    chain: 'ethereum',
                    account_address: ACCOUNT,
                    simulation: {
                        status: 'Success',
                        transaction_actions: ['bridge'],
                        account_summary: { assets_diffs: assetsDiffs },
                        cross_chain_asset_diffs: { [ACCOUNT]: crossChainDiffs },
                    },
                },
            }) as unknown as NetworkTxSimulationResult;

        const solNativeDiff = {
            asset_type: 'NATIVE',
            asset: { type: 'NATIVE', decimals: 9 },
            chain: 'solana',
            in: [{ raw_value: '1500000000', value: '1.5' }],
            out: [],
        };

        const ethRefundDiff = {
            asset_type: 'NATIVE',
            asset: { type: 'NATIVE', chain_id: 1, chain_name: 'ethereum', decimals: 18 },
            in: [{ raw_value: '0xde0b6b3a7640000', value: '1' }],
            out: [],
        };

        it('reads a native receive asset from the destination chain', () => {
            const result = createBridgeResult([solNativeDiff]);

            expect(getSimulatedReceiveAmount(result, ethSend, solReceive)).toBe('1.5');
        });

        it('never falls back to the source chain native asset', () => {
            const result = createBridgeResult([], [ethRefundDiff]);

            expect(getSimulatedReceiveAmount(result, ethSend, solReceive)).toBeNull();
        });

        it('prefers the bridged asset over an incoming source-chain asset', () => {
            const result = createBridgeResult([solNativeDiff], [ethRefundDiff]);

            expect(getSimulatedReceiveAmount(result, ethSend, solReceive)).toBe('1.5');
        });

        it('matches a bridged token by its destination-chain mint', () => {
            const splDiff = {
                asset_type: 'FUNGIBLE',
                asset: { type: 'FUNGIBLE', address: SOL_USDC_MINT, decimals: 6 },
                chain: 'solana',
                in: [{ raw_value: '250000000', value: '250' }],
                out: [],
            };

            expect(
                getSimulatedReceiveAmount(createBridgeResult([splDiff]), ethSend, solUsdcReceive),
            ).toBe('250');
        });

        it('returns null when the simulation reported no cross-chain movement', () => {
            const result = {
                method: 'ethereumSignTransaction',
                payload: {
                    needsDisclaimer: false,
                    simulation: { status: 'Success', account_summary: { assets_diffs: [] } },
                },
            } as unknown as NetworkTxSimulationResult;

            expect(getSimulatedReceiveAmount(result, ethSend, solReceive)).toBeNull();
        });
    });

    describe('solana', () => {
        // Solana reports a single in/out object per asset and numeric amounts.
        const solNativeDiff = {
            asset_type: 'NATIVE',
            asset: { type: 'SOL', decimals: 9 },
            in: { raw_value: 1500000000, value: 1.5 },
        };

        const usdcSplDiff = {
            asset_type: 'TOKEN',
            asset: {
                type: 'TOKEN',
                address: USDC_MINT,
                decimals: 6,
                name: 'USD Coin',
                symbol: 'USDC',
            },
            in: { raw_value: 250000000, value: 250 },
        };

        const solSend: CryptoId = `solana--${USDC_MINT}` as CryptoId;

        const createSolanaResult = (assetDiffs: unknown[]): NetworkTxSimulationResult =>
            ({
                method: 'solanaSignTransaction',
                payload: {
                    needsDisclaimer: false,
                    status: 'SUCCESS',
                    result: {
                        simulation: { account_summary: { account_assets_diff: assetDiffs } },
                    },
                },
            }) as unknown as NetworkTxSimulationResult;

        it('reads the native amount from the raw value', () => {
            expect(
                getSimulatedReceiveAmount(
                    createSolanaResult([solNativeDiff]),
                    solSend,
                    solQuoteReceive,
                ),
            ).toBe('1.5');
        });

        it('matches an SPL mint case-sensitively', () => {
            expect(
                getSimulatedReceiveAmount(
                    createSolanaResult([usdcSplDiff]),
                    solQuoteReceive,
                    splQuoteReceive,
                ),
            ).toBe('250');
            expect(
                getSimulatedReceiveAmount(
                    createSolanaResult([usdcSplDiff]),
                    solQuoteReceive,
                    `solana--${USDC_MINT.toLowerCase()}` as CryptoId,
                ),
            ).toBeNull();
        });

        it('returns null when the receive asset has no incoming transfer', () => {
            const outOnly = { ...solNativeDiff, in: null, out: { raw_value: 1, value: 1 } };

            expect(
                getSimulatedReceiveAmount(createSolanaResult([outOnly]), solSend, solQuoteReceive),
            ).toBeNull();
        });
    });
    describe('stellar', () => {
        // Stellar carries no decimals, so only `value` is usable, and `in` is a single object.
        const XLM_USDC_CONTRACT = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

        const xlmNativeDiff = {
            asset_type: 'NATIVE',
            asset: { type: 'NATIVE', code: 'XLM' },
            in: { raw_value: 15000000, value: 1.5 },
        };

        const usdcContractDiff = {
            asset_type: 'CONTRACT',
            asset: {
                type: 'CONTRACT',
                address: XLM_USDC_CONTRACT,
                name: 'USD Coin',
                symbol: 'USDC',
            },
            in: { raw_value: 2500000000, value: 250 },
        };

        const usdcLegacyDiff = {
            asset_type: 'ASSET',
            asset: {
                type: 'ASSET',
                code: 'USDC',
                issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                org_name: 'Centre',
                org_url: 'https://centre.io',
            },
            in: { raw_value: 2500000000, value: 250 },
        };

        const xlmReceive: CryptoId = 'stellar' as CryptoId;
        const usdcReceive: CryptoId = `stellar--${XLM_USDC_CONTRACT}` as CryptoId;
        const xlmSend: CryptoId = `stellar--${XLM_USDC_CONTRACT}` as CryptoId;

        const createStellarResult = (assetDiffs: unknown[]): NetworkTxSimulationResult =>
            ({
                method: 'stellarSignTransaction',
                payload: {
                    needsDisclaimer: false,
                    simulation: {
                        status: 'Success',
                        account_summary: { account_assets_diffs: assetDiffs },
                    },
                },
            }) as unknown as NetworkTxSimulationResult;

        it('reads the native amount from the value', () => {
            expect(
                getSimulatedReceiveAmount(
                    createStellarResult([xlmNativeDiff]),
                    xlmSend,
                    xlmReceive,
                ),
            ).toBe('1.5');
        });

        it('matches a contract asset by its address', () => {
            expect(
                getSimulatedReceiveAmount(
                    createStellarResult([usdcContractDiff]),
                    xlmReceive,
                    usdcReceive,
                ),
            ).toBe('250');
        });

        it('does not match a legacy asset, which carries no contract address', () => {
            expect(
                getSimulatedReceiveAmount(
                    createStellarResult([usdcLegacyDiff]),
                    xlmReceive,
                    usdcReceive,
                ),
            ).toBeNull();
        });

        it('does not read a legacy asset as the native one', () => {
            expect(
                getSimulatedReceiveAmount(
                    createStellarResult([usdcLegacyDiff]),
                    xlmSend,
                    xlmReceive,
                ),
            ).toBeNull();
        });

        it('returns null when the receive asset has no incoming transfer', () => {
            const outOnly = { ...xlmNativeDiff, in: null, out: { raw_value: 1, value: 1 } };

            expect(
                getSimulatedReceiveAmount(createStellarResult([outOnly]), xlmSend, xlmReceive),
            ).toBeNull();
        });

        it('returns null when the simulation errored', () => {
            const errored = {
                method: 'stellarSignTransaction',
                payload: { needsDisclaimer: false, simulation: { status: 'Error' } },
            } as unknown as NetworkTxSimulationResult;

            expect(getSimulatedReceiveAmount(errored, xlmSend, xlmReceive)).toBeNull();
        });
    });
});
