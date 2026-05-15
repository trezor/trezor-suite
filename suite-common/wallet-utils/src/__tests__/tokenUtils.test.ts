import { getContractAddressForNetworkSymbolFixtures } from '../__fixtures__/tokenUtils';
import { getAssetLogoContractAddresses, getContractAddressForNetworkSymbol } from '../tokenUtils';

describe('getContractAddressForNetworkSymbol', () => {
    getContractAddressForNetworkSymbolFixtures.forEach(
        ({ testName, symbol, contractAddress, expected }) => {
            test(testName, () => {
                const result = getContractAddressForNetworkSymbol(symbol, contractAddress);
                expect(result).toBe(expected);
            });
        },
    );
});

describe('getAssetLogoContractAddresses', () => {
    it('returns [policyId, contract] for ada', async () => {
        const policyId = 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc535';
        const contract = `${policyId}41474958`;
        await expect(getAssetLogoContractAddresses('ada', contract)).resolves.toEqual([
            policyId,
            contract,
        ]);
    });

    it('returns [sacId, contract] for xlm', async () => {
        const classic = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
        const expectedSACId = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
        await expect(getAssetLogoContractAddresses('xlm', classic)).resolves.toEqual([
            classic,
            expectedSACId,
        ]);
    });

    it('returns [contract] for eth', async () => {
        const contract = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        await expect(getAssetLogoContractAddresses('eth', contract)).resolves.toEqual([
            contract.toLowerCase(),
        ]);
    });
});
