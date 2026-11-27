import { getEarnFeedbackPayloads, getYieldClaimFeedbackContext } from './earnFeedback';

describe(getEarnFeedbackPayloads.name, () => {
    it('reports the canonical staking product ID without repeating its asset, network, or provider', () => {
        const productId = 'trx:trx:curated:native';

        expect(
            getEarnFeedbackPayloads({
                feature: 'staking',
                context: 'stake',
                details: { productId },
            }),
        ).toStrictEqual({
            suggestion: {
                category: 'feature',
                feature: 'staking',
                context: 'stake',
                productId,
            },
            analytics: { category: 'staking', context: 'stake', productId },
        });
    });

    it('reports the vault ID once for a vault operation', () => {
        const context = 'withdraw';
        const vaultId = 'public-vault-id';

        expect(
            getEarnFeedbackPayloads({
                feature: 'yield',
                context,
                details: { vaultId },
            }),
        ).toStrictEqual({
            suggestion: { category: 'feature', feature: 'yield', context, vaultId },
            analytics: { category: 'yield', context, provider: vaultId },
            yieldInteraction: { vaultId },
        });
    });

    it('reports distinct reward tokens for a claim using both transports', () => {
        const details = getYieldClaimFeedbackContext([
            { token: { symbol: 'USDC', networkSymbol: 'base' } },
            { token: { symbol: 'MORPHO', networkSymbol: 'base' } },
            { token: { symbol: 'USDC', networkSymbol: 'base' } },
        ]);

        expect(
            getEarnFeedbackPayloads({
                feature: 'yield',
                context: 'claim',
                details,
            }),
        ).toStrictEqual({
            suggestion: {
                category: 'feature',
                feature: 'yield',
                context: 'claim',
                networkSymbol: 'base',
                tokenSymbols: ['MORPHO', 'USDC'],
            },
            analytics: {
                category: 'yield',
                context: 'claim',
                networkSymbol: 'base',
                tokenSymbols: ['MORPHO', 'USDC'],
            },
            yieldInteraction: { networkSymbol: 'base', tokenSymbols: ['MORPHO', 'USDC'] },
        });
    });

    it('retains the account network when no reward metadata is available', () => {
        expect(
            getEarnFeedbackPayloads({
                feature: 'yield',
                context: 'claim',
                details: getYieldClaimFeedbackContext([], 'eth'),
            }),
        ).toStrictEqual({
            suggestion: {
                category: 'feature',
                feature: 'yield',
                context: 'claim',
                networkSymbol: 'eth',
            },
            analytics: { category: 'yield', context: 'claim', networkSymbol: 'eth' },
            yieldInteraction: { networkSymbol: 'eth' },
        });
    });
});
