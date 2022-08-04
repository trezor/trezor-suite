// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoTokenBundle.js

import { validateParams } from '../common/paramsValidator';
import type { PROTO } from '../../constants';
import type { CardanoAssetGroup, CardanoToken } from '../../types/api/cardano';

export type AssetGroupWithTokens = {
    policyId: string;
    tokens: PROTO.CardanoToken[];
};

const validateTokens = (tokenAmounts: CardanoToken[]) => {
    tokenAmounts.forEach(tokenAmount => {
        validateParams(tokenAmount, [
            { name: 'assetNameBytes', type: 'string', required: true },
            { name: 'amount', type: 'uint' },
            { name: 'mintAmount', type: 'uint', allowNegative: true },
        ]);
    });
};

const validateTokenBundle = (tokenBundle: CardanoAssetGroup[]) => {
    tokenBundle.forEach(tokenGroup => {
        validateParams(tokenGroup, [
            { name: 'policyId', type: 'string', required: true },
            { name: 'tokenAmounts', type: 'array', required: true },
        ]);

        validateTokens(tokenGroup.tokenAmounts);
    });
};

const tokenAmountsToProto = (tokenAmounts: CardanoToken[]): PROTO.CardanoToken[] =>
    tokenAmounts.map(tokenAmount => ({
        asset_name_bytes: tokenAmount.assetNameBytes,
        amount: tokenAmount.amount,
        mint_amount: tokenAmount.mintAmount,
    }));

export const tokenBundleToProto = (tokenBundle: CardanoAssetGroup[]): AssetGroupWithTokens[] => {
    validateTokenBundle(tokenBundle);
    return tokenBundle.map(tokenGroup => ({
        policyId: tokenGroup.policyId,
        tokens: tokenAmountsToProto(tokenGroup.tokenAmounts),
    }));
};
