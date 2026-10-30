import { type TokenInfo } from '@suite-common/token-definitions';
import { type AddressType } from '@suite-common/wallet-types';

export type AssetAddressField = {
    type: AddressType;
    value: string;
};

export const getAssetAddressFields = (
    token: Pick<TokenInfo, 'contract' | 'fingerprint' | 'policyId'> | null,
): AssetAddressField[] => {
    if (token === null) {
        return [];
    }

    if (!token.policyId) {
        return [{ type: 'contract', value: token.contract }];
    }

    const policyIdField: AssetAddressField = { type: 'policyId', value: token.policyId };

    return token.fingerprint
        ? [{ type: 'fingerprint', value: token.fingerprint }, policyIdField]
        : [policyIdField];
};
