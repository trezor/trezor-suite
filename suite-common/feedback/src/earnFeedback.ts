import { type FeedbackCategory } from './feedback';

export type EarnFeedbackFeature = Extract<FeedbackCategory, 'staking' | 'yield'>;

type EarnFeedbackAssets = {
    networkSymbol?: string;
    tokenSymbols?: string[];
};

export type EarnFeedbackContext = EarnFeedbackAssets & {
    productId?: string;
    vaultId?: string;
};

type EarnFeedbackParams = {
    feature: EarnFeedbackFeature;
    context: string;
    details: EarnFeedbackContext;
};

type EarnFeedbackPayloads = {
    suggestion: EarnFeedbackContext & {
        category: 'feature';
        feature: EarnFeedbackFeature;
        context: string;
    };
    analytics: EarnFeedbackAssets & {
        category: EarnFeedbackFeature;
        context: string;
        provider?: string;
        productId?: string;
    };
    yieldInteraction?: EarnFeedbackAssets & { vaultId?: string };
};

export const getEarnFeedbackPayloads = ({
    feature,
    context,
    details: { networkSymbol, tokenSymbols, productId, vaultId },
}: EarnFeedbackParams): EarnFeedbackPayloads => {
    const assets = {
        ...(networkSymbol && { networkSymbol }),
        ...(tokenSymbols?.length && { tokenSymbols }),
    };
    const stakingProduct = productId ? { productId } : {};
    const vault = vaultId ? { vaultId } : {};
    const hasYieldInteraction =
        feature === 'yield' && ['deposit', 'withdraw', 'redeem', 'claim'].includes(context);

    return {
        suggestion: {
            category: 'feature',
            feature,
            context,
            ...assets,
            ...stakingProduct,
            ...vault,
        },
        analytics: {
            category: feature,
            context,
            ...(vaultId && { provider: vaultId }),
            ...assets,
            ...stakingProduct,
        },
        ...(hasYieldInteraction && { yieldInteraction: { ...vault, ...assets } }),
    };
};

type YieldClaimFeedbackReward = {
    token: { symbol: string; networkSymbol: string };
};

export const getYieldClaimFeedbackContext = (
    rewards: readonly YieldClaimFeedbackReward[],
    networkSymbol?: string | null,
): EarnFeedbackAssets => ({
    networkSymbol: networkSymbol ?? rewards[0]?.token.networkSymbol,
    tokenSymbols: [...new Set(rewards.map(({ token }) => token.symbol))].sort(),
});
