// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoTokenBundle.js

import { PROTO } from '../../constants';
import { CardanoAssetGroup, CardanoToken } from '../../types/api/cardano';
import { Assert, Type, Static } from '@trezor/schema-utils';

export type AssetGroupWithTokens = Static<typeof AssetGroupWithTokens>;
export const AssetGroupWithTokens = Type.Object({
    policyId: Type.String(),
    tokens: Type.Array(PROTO.CardanoToken, { minItems: 1 }),
});

const tokenAmountsToProto = (tokenAmounts: CardanoToken[]): PROTO.CardanoToken[] =>
    tokenAmounts.map(tokenAmount => ({
        asset_name_bytes: tokenAmount.assetNameBytes,
        amount: tokenAmount.amount,
        mint_amount: tokenAmount.mintAmount,
    }));

export const tokenBundleToProto = (tokenBundle: CardanoAssetGroup[]): AssetGroupWithTokens[] => {
    Assert(Type.Array(CardanoAssetGroup), tokenBundle);
    return tokenBundle.map(tokenGroup => ({
        policyId: tokenGroup.policyId,
        tokens: tokenAmountsToProto(tokenGroup.tokenAmounts),
    }));
};
