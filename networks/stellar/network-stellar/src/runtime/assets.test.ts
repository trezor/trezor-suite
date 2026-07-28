import { computeSorobanAssetContractId } from './assets';

describe('assets', () => {
    describe('computeSorobanAssetContractId', () => {
        const classic = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
        const expectedSACId = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

        it('derives the Soroban contract id from a classic CODE-ISSUER', () => {
            expect(computeSorobanAssetContractId(classic).sorobanAssetContractId).toBe(
                expectedSACId,
            );
        });

        it('throws when the input is not in strict CODE-ISSUER format', () => {
            expect(() => computeSorobanAssetContractId(classic.replace('-', ':'))).toThrow(
                'Invalid Stellar asset contract format.',
            );
            expect(() => computeSorobanAssetContractId(`${classic}-1`)).toThrow(
                'Invalid Stellar asset contract format.',
            );
            expect(() => computeSorobanAssetContractId(expectedSACId)).toThrow(
                'Invalid Stellar asset contract format.',
            );
            expect(() => computeSorobanAssetContractId('not-stellar')).toThrow(
                'Invalid Stellar asset contract format.',
            );
        });
    });
});
