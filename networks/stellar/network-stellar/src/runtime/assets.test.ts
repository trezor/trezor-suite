import { computeSorobanAssetContractId, isValidContractId } from './assets';

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

    describe('isValidContractId', () => {
        it.each([
            [
                'a native SEP-41 contract address',
                'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV',
                true,
            ],
            [
                'a Stellar Asset Contract address',
                'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
                true,
            ],
            [
                'a classic CODE-ISSUER asset',
                'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                false,
            ],
            [
                'an ed25519 account address',
                'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                false,
            ],
            ['an empty string', '', false],
        ])('%s', (_description, address, expected) => {
            expect(isValidContractId(address)).toBe(expected);
        });
    });
});
