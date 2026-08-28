import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';
import stellar from '@trezor/network-stellar/runtime';

import { getStellarInactiveTokens, resolveStellarAssetFromContractId } from './stellarTokens';

const xlmSymbol = asNetworkSymbol('xlm');

jest.mock('@trezor/blockchain-link-utils/src/stellar', () => ({
    STELLAR_DECIMALS: 7,
    getTokenMetadata: jest.fn(),
}));

const mockedGetTokenMetadata = jest.mocked(getTokenMetadata);

describe(getStellarInactiveTokens.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns empty array for non-Stellar accounts', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

        await expect(getStellarInactiveTokens(account)).resolves.toEqual([]);
        expect(mockedGetTokenMetadata).not.toHaveBeenCalled();
    });

    it('returns all tokens when account has no active Stellar tokens', async () => {
        const account = mockWalletAccount({ symbol: xlmSymbol, tokens: undefined });

        mockedGetTokenMetadata.mockResolvedValue({
            'USDC-GA123': { name: 'USD Coin', symbol: 'USDC', home_domain: 'centre.io', rating: 5 },
            'AQUA-GB456': { name: 'Aqua', symbol: 'AQUA', home_domain: 'aqua.network', rating: 2 },
        });

        await expect(getStellarInactiveTokens(account)).resolves.toEqual([
            {
                type: 'STELLAR-CLASSIC',
                standard: 'STELLAR-CLASSIC',
                contract: 'USDC-GA123',
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 7,
                homeDomain: 'centre.io',
                rating: 5,
            },
            {
                type: 'STELLAR-CLASSIC',
                standard: 'STELLAR-CLASSIC',
                contract: 'AQUA-GB456',
                name: 'Aqua',
                symbol: 'AQUA',
                decimals: 7,
                homeDomain: 'aqua.network',
                rating: 2,
            },
        ]);
    });

    it('filters out active Stellar tokens', async () => {
        const account = mockWalletAccount({
            symbol: xlmSymbol,
            tokens: [{ contract: 'YBX-GC789' }] as never,
        });

        mockedGetTokenMetadata.mockResolvedValue({
            'USDC-GA123': { name: 'USD Coin', symbol: 'USDC', home_domain: 'centre.io', rating: 5 },
            'AQUA-GB456': { name: 'Aqua', symbol: 'AQUA', home_domain: 'aqua.network', rating: 2 },
            'YBX-GC789': { name: 'YBX', symbol: 'YBX', home_domain: 'ultra.io', rating: 1 },
        });

        await expect(getStellarInactiveTokens(account)).resolves.toEqual([
            expect.objectContaining({ contract: 'USDC-GA123' }),
            expect.objectContaining({ contract: 'AQUA-GB456' }),
        ]);
    });

    it('sorts tokens by rating in descending order and keeps unrated tokens last', async () => {
        const account = mockWalletAccount({ symbol: xlmSymbol });

        mockedGetTokenMetadata.mockResolvedValue({
            'LOW-GA111': { name: 'Low', symbol: 'LOW', home_domain: 'low.org', rating: 1 },
            'UNRATED-GA222': { name: 'Unrated', symbol: 'UNRATED', home_domain: 'none.org' },
            'HIGH-GA333': { name: 'High', symbol: 'HIGH', home_domain: 'high.org', rating: 9 },
        });

        const result = await getStellarInactiveTokens(account);

        expect(result.map(token => token.contract)).toEqual([
            'HIGH-GA333',
            'LOW-GA111',
            'UNRATED-GA222',
        ]);

        expect(result[2]?.rating).toBeUndefined();
    });
});

const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const CATCOIN_ISSUER = 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z';
const USDC = `USDC-${USDC_ISSUER}`;
const CATCOIN = `CATCOIN-${CATCOIN_ISSUER}`;

const definitionsOf = (...contracts: string[]) =>
    Object.fromEntries(contracts.map(contract => [contract, { name: contract, symbol: contract }]));

describe(resolveStellarAssetFromContractId.name, () => {
    let usdcContractId: string;
    let catcoinContractId: string;

    beforeAll(async () => {
        const { computeSorobanAssetContractId } = await stellar();
        usdcContractId = computeSorobanAssetContractId(USDC).sorobanAssetContractId;
        catcoinContractId = computeSorobanAssetContractId(CATCOIN).sorobanAssetContractId;
    });

    it('resolves a contract id to the asset it wraps', async () => {
        await expect(
            resolveStellarAssetFromContractId(usdcContractId, definitionsOf(USDC, CATCOIN)),
        ).resolves.toEqual({ assetCode: 'USDC', assetIssuer: USDC_ISSUER });
    });

    it('resolves an asset with a 12 character code', async () => {
        await expect(
            resolveStellarAssetFromContractId(catcoinContractId, definitionsOf(USDC, CATCOIN)),
        ).resolves.toEqual({ assetCode: 'CATCOIN', assetIssuer: CATCOIN_ISSUER });
    });

    it('returns nothing for an asset missing from the definitions', async () => {
        await expect(
            resolveStellarAssetFromContractId(usdcContractId, definitionsOf(CATCOIN)),
        ).resolves.toBeUndefined();
    });

    it('returns nothing for values that are not contract ids', async () => {
        const definitions = definitionsOf(USDC);

        await expect(
            resolveStellarAssetFromContractId('USDC', definitions),
        ).resolves.toBeUndefined();
        await expect(
            resolveStellarAssetFromContractId(USDC_ISSUER, definitions),
        ).resolves.toBeUndefined();
        await expect(resolveStellarAssetFromContractId('', definitions)).resolves.toBeUndefined();
    });

    it('ignores definition entries that are not classic assets', async () => {
        const definitions = {
            ...definitionsOf(USDC),
            ...definitionsOf('not-an-asset'),
            ...definitionsOf(usdcContractId),
        };

        await expect(
            resolveStellarAssetFromContractId(usdcContractId, definitions),
        ).resolves.toEqual({ assetCode: 'USDC', assetIssuer: USDC_ISSUER });
    });
});
