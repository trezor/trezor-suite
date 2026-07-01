import { typedObjectKeys } from '@trezor/utils';

import { CLEAR_SIGNED_SWAP_SELECTORS, getEvmClearSignedSwapCoverage } from '../clearSigning';
import { DECODABLE_SWAP_SELECTORS, decodeClearSignedSwap } from '../clearSigningSwap';
import { ONEINCH_FIXTURES } from '../fixtures/oneInchClearSigning';

const ONEINCH = '0x111111125421cA6dc452d289314280a0f8842A65';
const LIFI = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE';
const UNISWAP = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';

const ONEINCH_COVERAGE: Record<keyof typeof ONEINCH_FIXTURES, 'full' | 'partial'> = {
    swap: 'full',
    unoswap: 'partial',
    unoswapTo: 'partial',
    unoswap2: 'partial',
    unoswap3: 'partial',
    unoswapTo2: 'partial',
    unoswapTo3: 'partial',
    ethUnoswap: 'partial',
    ethUnoswap2: 'partial',
    ethUnoswap3: 'partial',
    ethUnoswapTo: 'partial',
    ethUnoswapTo2: 'partial',
    ethUnoswapTo3: 'partial',
};

const ETH_VALUE = 0x71afd498d0000n;

describe(getEvmClearSignedSwapCoverage.name, () => {
    describe('firmware version gating', () => {
        it('returns undefined for the 2.12.2 batch (1inch) on 2.12.1 firmware', () => {
            expect(
                getEvmClearSignedSwapCoverage(1, ONEINCH, ONEINCH_FIXTURES.swap, '2.12.1'),
            ).toBeUndefined();
        });

        it('returns the coverage for the 2.12.2 batch on 2.12.2 firmware', () => {
            expect(getEvmClearSignedSwapCoverage(1, ONEINCH, ONEINCH_FIXTURES.swap, '2.12.2')).toBe(
                'full',
            );
            expect(
                getEvmClearSignedSwapCoverage(1, ONEINCH, ONEINCH_FIXTURES.unoswap, '2.12.2'),
            ).toBe('partial');
        });

        it('returns full for the 2.12.1 batch (LI.FI swapTokensGeneric) on 2.12.1 firmware', () => {
            expect(getEvmClearSignedSwapCoverage(1, LIFI, '0x4630a0d8dead', '2.12.1')).toBe('full');
        });

        it('gates moved LI.FI deployments per firmware: canonical bound by 2.12.1, chain-specific since 2.12.2', () => {
            const ZKSYNC_ALT = '0x341e94069f53234fe6dabef707ad424830525715';
            // swapTokensGeneric selector on zkSync Era (324)
            expect(getEvmClearSignedSwapCoverage(324, LIFI, '0x4630a0d8dead', '2.12.1')).toBe(
                'full',
            );
            expect(
                getEvmClearSignedSwapCoverage(324, LIFI, '0x4630a0d8dead', '2.12.2'),
            ).toBeUndefined();
            expect(
                getEvmClearSignedSwapCoverage(324, ZKSYNC_ALT, '0x4630a0d8dead', '2.12.1'),
            ).toBeUndefined();
            expect(getEvmClearSignedSwapCoverage(324, ZKSYNC_ALT, '0x4630a0d8dead', '2.12.2')).toBe(
                'full',
            );
        });

        it('returns undefined for clear-signing-capable firmware older than the selector batch', () => {
            expect(
                getEvmClearSignedSwapCoverage(1, LIFI, '0x4630a0d8dead', '2.12.0'),
            ).toBeUndefined();
        });
    });

    describe('non-swap / unknown', () => {
        it('returns undefined for an unknown selector on a known router', () => {
            expect(
                getEvmClearSignedSwapCoverage(1, ONEINCH, '0xdeadbeef', '2.13.0'),
            ).toBeUndefined();
        });

        it('returns undefined for a global ERC-20 selector (approve is not a swap)', () => {
            expect(
                getEvmClearSignedSwapCoverage(1, ONEINCH, '0x095ea7b3dead', '2.13.0'),
            ).toBeUndefined();
        });

        it('returns undefined (does not throw) for an empty firmware version', () => {
            expect(
                getEvmClearSignedSwapCoverage(1, ONEINCH, ONEINCH_FIXTURES.swap, ''),
            ).toBeUndefined();
        });

        it('returns undefined for the wrong chain', () => {
            // Uniswap router is mainnet-only
            expect(
                getEvmClearSignedSwapCoverage(137, UNISWAP, '0x04e45aafdead', '2.13.0'),
            ).toBeUndefined();
        });
    });

    // Drift guard: a 'full' selector must decode a receive leg, a 'partial' one must
    // not. Catches a misclassified selector or decoder/firmware divergence.
    describe('coverage matches decoded receive-leg presence (real fixtures)', () => {
        it.each(typedObjectKeys(ONEINCH_COVERAGE))('%s', name => {
            const data = ONEINCH_FIXTURES[name];
            const coverage = getEvmClearSignedSwapCoverage(1, ONEINCH, data, '2.12.2');
            const decoded = decodeClearSignedSwap(data, ETH_VALUE);

            expect(coverage).toBe(ONEINCH_COVERAGE[name]);
            expect(decoded).not.toBeNull();
            expect(Boolean(decoded?.receive)).toBe(coverage === 'full');
        });
    });

    // Drift guard across ALL definitions: the coverage table (clearSigning.ts) and the
    // decoder table (clearSigningSwap.ts) are maintained separately; adding a selector
    // to one without the other must fail here, not silently at runtime.
    describe('coverage definitions vs decoder coverage', () => {
        // Selectors intentionally without a calldata decoder: their review amounts
        // still come from the quote. Shrink this list as decoders are added.
        const QUOTE_RENDERED_SELECTORS = new Set([
            '5fd9ae2e', // LI.FI swapTokensMultipleV3ERC20ToERC20
            '2c57e884', // LI.FI swapTokensMultipleV3ERC20ToNative
            '736eac0b', // LI.FI swapTokensMultipleV3NativeToERC20
            '4666fc80', // LI.FI swapTokensSingleV3ERC20ToERC20
            '733214a3', // LI.FI swapTokensSingleV3ERC20ToNative
            'af7060fd', // LI.FI swapTokensSingleV3NativeToERC20
            '4630a0d8', // LI.FI swapTokensGeneric
            'b858183f', // Uniswap exactInput
            '04e45aaf', // Uniswap exactInputSingle
            '09b81346', // Uniswap exactOutput
            '5023b4df', // Uniswap exactOutputSingle
        ]);

        it.each(CLEAR_SIGNED_SWAP_SELECTORS)(
            'selector $selector ($coverage) has a matching decoder or is explicitly quote-rendered',
            ({ selector, coverage }) => {
                if (QUOTE_RENDERED_SELECTORS.has(selector)) {
                    expect(DECODABLE_SWAP_SELECTORS.full.has(selector)).toBe(false);
                    expect(DECODABLE_SWAP_SELECTORS.partial.has(selector)).toBe(false);
                } else {
                    expect(DECODABLE_SWAP_SELECTORS[coverage].has(selector)).toBe(true);
                }
            },
        );

        it('every decodable selector is present in the coverage definitions', () => {
            const defined = new Set(CLEAR_SIGNED_SWAP_SELECTORS.map(({ selector }) => selector));
            [...DECODABLE_SWAP_SELECTORS.full, ...DECODABLE_SWAP_SELECTORS.partial].forEach(
                selector => expect(defined).toContain(selector),
            );
        });
    });
});
