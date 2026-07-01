import { isEvmClearSigningTx } from '../clearSigning';

const UNISWAP_V3_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const LIFI_ADDRESS = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE';
const RANDOM_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

// exactInputSingle(tuple)
const UNISWAP_DATA = '0x04e45aaf000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
// swapTokensGeneric(...)
const LIFI_DATA = '0x4630a0d8000000000000000000000000000000000000000000000000000000000000dead';
// approve(address,uint256)
const APPROVE_DATA = '0x095ea7b3000000000000000000000000000000000000000000000000000000000000dead';
// transfer(address,uint256)
const TRANSFER_DATA = '0xa9059cbb000000000000000000000000000000000000000000000000000000000000dead';

describe(isEvmClearSigningTx.name, () => {
    describe('no data', () => {
        it('returns false for undefined data', () => {
            expect(isEvmClearSigningTx(1, UNISWAP_V3_ADDRESS, undefined)).toBe(false);
        });

        it('returns false for empty string', () => {
            expect(isEvmClearSigningTx(1, UNISWAP_V3_ADDRESS, '')).toBe(false);
        });

        it('returns false for data shorter than 4 bytes', () => {
            expect(isEvmClearSigningTx(1, UNISWAP_V3_ADDRESS, '0x04e45a')).toBe(false);
        });

        it('returns true for data of exactly 6144 bytes', () => {
            // selector (4 bytes) + 6140 bytes padding = 6144 bytes total
            const maxSize = '0x' + 'a9059cbb' + 'ab'.repeat(6140);
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, maxSize)).toBe(true);
        });

        it('returns false for data > 6144 bytes', () => {
            // selector (4 bytes) + 6141 bytes padding = 6145 bytes total
            const oversized = '0x' + 'a9059cbb' + 'ab'.repeat(6141);
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, oversized)).toBe(false);
        });
    });

    describe('unknown selector', () => {
        it('returns false for an unrecognised function selector on a known contract', () => {
            expect(isEvmClearSigningTx(1, UNISWAP_V3_ADDRESS, '0xdeadbeef')).toBe(false);
        });

        it('returns false for an unrecognised selector on a random contract', () => {
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, '0xdeadbeef')).toBe(false);
        });
    });

    describe('global selectors (any contract, any chain)', () => {
        it('recognises approve on an arbitrary contract', () => {
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, APPROVE_DATA)).toBe(true);
        });

        it('recognises transfer on an arbitrary contract', () => {
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, TRANSFER_DATA)).toBe(true);
        });

        it('returns false without a to address (contract creation)', () => {
            expect(isEvmClearSigningTx(1, null, APPROVE_DATA)).toBe(false);
        });

        it('recognises approve on a non-mainnet chain', () => {
            expect(isEvmClearSigningTx(137, RANDOM_ADDRESS, APPROVE_DATA)).toBe(true);
        });

        it('handles uppercase hex in data', () => {
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, APPROVE_DATA.toUpperCase())).toBe(true);
        });
    });

    describe('Uniswap V3 Router (chain 1 only)', () => {
        it('recognises exactInputSingle on mainnet', () => {
            expect(isEvmClearSigningTx(1, UNISWAP_V3_ADDRESS, UNISWAP_DATA)).toBe(true);
        });

        it('returns false on a chain not in the binding', () => {
            expect(isEvmClearSigningTx(137, UNISWAP_V3_ADDRESS, UNISWAP_DATA)).toBe(false);
        });

        it('returns false for a different contract on mainnet', () => {
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, UNISWAP_DATA)).toBe(false);
        });

        it('handles mixed-case to address', () => {
            expect(isEvmClearSigningTx(1, UNISWAP_V3_ADDRESS.toLowerCase(), UNISWAP_DATA)).toBe(
                true,
            );
        });

        it.each([
            ['exactInput', '0xb858183f'],
            ['exactInputSingle', '0x04e45aaf'],
            ['exactOutput', '0x09b81346'],
            ['exactOutputSingle', '0x5023b4df'],
        ])('recognises %s', (_name, selector) => {
            expect(isEvmClearSigningTx(1, UNISWAP_V3_ADDRESS, selector)).toBe(true);
        });
    });

    describe('LI.FI Diamond (multiple chains)', () => {
        it('recognises swapTokensGeneric on mainnet', () => {
            expect(isEvmClearSigningTx(1, LIFI_ADDRESS, LIFI_DATA)).toBe(true);
        });

        it('recognises swapTokensGeneric on Polygon (137)', () => {
            expect(isEvmClearSigningTx(137, LIFI_ADDRESS, LIFI_DATA)).toBe(true);
        });

        it('returns false on a chain not in the binding', () => {
            expect(isEvmClearSigningTx(999, LIFI_ADDRESS, LIFI_DATA)).toBe(false);
        });

        it('returns false for a different contract', () => {
            expect(isEvmClearSigningTx(1, RANDOM_ADDRESS, LIFI_DATA)).toBe(false);
        });
    });

    // On zkSync/Metis/Linea/Taiko the diamond moved from the canonical address
    // (bound by 2.12.1 firmware) to a chain-specific one (since 2.12.2). This
    // version-agnostic predicate matches both; getEvmClearSignedSwapCoverage resolves
    // which one a given firmware actually binds.
    describe('LI.FI Diamond (moved deployments)', () => {
        const ZKSYNC_ALT_ADDRESS = '0x341e94069f53234fe6dabef707ad424830525715';

        it('recognises the chain-specific address on zkSync Era (324)', () => {
            expect(isEvmClearSigningTx(324, ZKSYNC_ALT_ADDRESS, LIFI_DATA)).toBe(true);
        });

        it('recognises the canonical address on zkSync Era (bound by 2.12.1)', () => {
            expect(isEvmClearSigningTx(324, LIFI_ADDRESS, LIFI_DATA)).toBe(true);
        });

        it('does not match the chain-specific address on a chain it is not deployed on', () => {
            expect(isEvmClearSigningTx(1, ZKSYNC_ALT_ADDRESS, LIFI_DATA)).toBe(false);
        });
    });
});
