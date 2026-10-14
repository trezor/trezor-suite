import { computeSorobanAssetContractId } from './assets';
import { resolveClassicAssetFromContractId } from './sacResolution';

const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const CATCOIN_ISSUER = 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z';
const USDC = `USDC-${USDC_ISSUER}`;
const CATCOIN = `CATCOIN12345-${CATCOIN_ISSUER}`;

const definitionsOf = (...contracts: string[]) =>
    Object.fromEntries(contracts.map(contract => [contract, { name: contract }]));

describe(resolveClassicAssetFromContractId.name, () => {
    const usdcContractId = computeSorobanAssetContractId(USDC).sorobanAssetContractId;
    const catcoinContractId = computeSorobanAssetContractId(CATCOIN).sorobanAssetContractId;

    it('resolves a contract id to the asset it wraps', async () => {
        await expect(
            resolveClassicAssetFromContractId(usdcContractId, definitionsOf(USDC, CATCOIN)),
        ).resolves.toEqual({ assetCode: 'USDC', assetIssuer: USDC_ISSUER });
    });

    it('resolves an asset with a 12 character code', async () => {
        await expect(
            resolveClassicAssetFromContractId(catcoinContractId, definitionsOf(USDC, CATCOIN)),
        ).resolves.toEqual({ assetCode: 'CATCOIN12345', assetIssuer: CATCOIN_ISSUER });
    });

    it('returns nothing for an asset missing from the definitions', async () => {
        await expect(
            resolveClassicAssetFromContractId(usdcContractId, definitionsOf(CATCOIN)),
        ).resolves.toBeUndefined();
    });

    it('returns nothing for values that are not contract ids', async () => {
        const definitions = definitionsOf(USDC);

        await expect(
            resolveClassicAssetFromContractId('USDC', definitions),
        ).resolves.toBeUndefined();
        await expect(
            resolveClassicAssetFromContractId(USDC_ISSUER, definitions),
        ).resolves.toBeUndefined();
        await expect(resolveClassicAssetFromContractId('', definitions)).resolves.toBeUndefined();
    });

    it('ignores definition entries that are not classic assets', async () => {
        const definitions = {
            ...definitionsOf(USDC),
            ...definitionsOf('not-an-asset'),
            ...definitionsOf(usdcContractId),
        };

        await expect(
            resolveClassicAssetFromContractId(usdcContractId, definitions),
        ).resolves.toEqual({ assetCode: 'USDC', assetIssuer: USDC_ISSUER });
    });
});
