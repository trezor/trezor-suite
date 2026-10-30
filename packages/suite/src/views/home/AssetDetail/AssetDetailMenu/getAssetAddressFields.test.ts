import { getAssetAddressFields } from './getAssetAddressFields';

describe('getAssetAddressFields', () => {
    it('has no field for a coin', () => {
        expect(getAssetAddressFields(null)).toEqual([]);
    });

    it('shows a token by its contract', () => {
        expect(getAssetAddressFields({ contract: '0xa0b8' })).toEqual([
            { type: 'contract', value: '0xa0b8' },
        ]);
    });

    it('shows a Cardano token by its fingerprint and policy ID instead of its contract', () => {
        expect(
            getAssetAddressFields({
                contract: '681b5d03a10fd2764d494e',
                fingerprint: 'asset1zjaqv0erxz',
                policyId: '681b5d03a10fd276',
            }),
        ).toEqual([
            { type: 'fingerprint', value: 'asset1zjaqv0erxz' },
            { type: 'policyId', value: '681b5d03a10fd276' },
        ]);
    });

    it('shows only the policy ID of a Cardano token without a fingerprint', () => {
        expect(
            getAssetAddressFields({ contract: '681b5d03a10fd276', policyId: '681b5d03a10fd276' }),
        ).toEqual([{ type: 'policyId', value: '681b5d03a10fd276' }]);
    });
});
