import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';
import {
    EVERSTAKE_SOLANA_DEVNET_VALIDATOR,
    EVERSTAKE_SOLANA_MAINNET_VALIDATOR,
} from '@trezor/network-solana/constants';

import { STAKING_SYMBOLS } from './legacyNetworks';
import { asNetworkSymbol } from './networkTypes';
import {
    STAKING_PRODUCTS,
    findStakingProduct,
    getStakingProductByCardanoPoolId,
    getStakingProductByEthereumContract,
    getStakingProductBySolanaVoterPubkey,
    getStakingProductByTronSrAddress,
    getStakingProductId,
    getStakingProviderByCardanoPoolId,
    getStakingProviderByEthereumContract,
    getStakingProviderBySolanaVoterPubkey,
    getStakingProviderByTronSrAddress,
    listStakingProducts,
} from './stakingProducts';
import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    LUGANODES_TRON_SRS,
    P2P_ORG_TRON_SRS,
} from './stakingProviderConstants';

const ethSymbol = asNetworkSymbol('eth');
const thodSymbol = asNetworkSymbol('thod');
const trxSymbol = asNetworkSymbol('trx');

const UNKNOWN_CONTRACT = '0x624087DD1904ab122A32878Ce9e933C7071F53B9';

describe('STAKING_PRODUCTS', () => {
    it('derives every id from the network, asset, provider and kind', () => {
        STAKING_PRODUCTS.forEach(product => {
            expect(product.id).toBe(getStakingProductId(product));
        });
        expect(STAKING_PRODUCTS.map(product => product.id)).toEqual([
            'eth:eth:everstake:pooled',
            'thod:thod:everstake:pooled',
            'sol:sol:everstake:native',
            'dsol:dsol:everstake:native',
            'ada:ada:everstake:native',
            'ada:ada:fivebinaries:native',
            'trx:trx:luganodes:native',
            'trx:trx:p2p.org:native',
        ]);
    });

    it('identifies every product uniquely', () => {
        const ids = STAKING_PRODUCTS.map(product => product.id);

        expect(new Set(ids).size).toBe(ids.length);
    });

    it('offers products on staking networks only', () => {
        STAKING_PRODUCTS.forEach(product => {
            expect(STAKING_SYMBOLS).toContain(product.symbol);
        });
    });
});

describe(findStakingProduct.name, () => {
    it('finds a product by its id', () => {
        const id = getStakingProductId({
            symbol: trxSymbol,
            asset: trxSymbol,
            providerId: 'luganodes',
            kind: 'native',
        });

        expect(findStakingProduct(id)?.identity).toEqual({
            type: 'tron-super-representative',
            addresses: LUGANODES_TRON_SRS,
        });
    });

    it('finds nothing for an id outside the catalog', () => {
        const id = getStakingProductId({
            symbol: ethSymbol,
            asset: ethSymbol,
            providerId: 'everstake',
            kind: 'native',
        });

        expect(findStakingProduct(id)).toBeUndefined();
    });
});

describe(listStakingProducts.name, () => {
    it('lists the products of a network', () => {
        expect(listStakingProducts(ethSymbol).map(product => product.id)).toEqual([
            'eth:eth:everstake:pooled',
        ]);
        expect(listStakingProducts(trxSymbol).map(product => product.providerId)).toEqual([
            'luganodes',
            'p2p.org',
        ]);
    });

    it('returns the same empty list for a network without staking', () => {
        const bitcoin = listStakingProducts(asNetworkSymbol('btc'));

        expect(bitcoin).toEqual([]);
        expect(listStakingProducts(asNetworkSymbol('ltc'))).toBe(bitcoin);
    });
});

describe(getStakingProductByEthereumContract.name, () => {
    it('matches the accounting contract regardless of case', () => {
        const accounting = EVERSTAKE_CONTRACTS[1].accounting.toLowerCase();

        expect(getStakingProductByEthereumContract(ethSymbol, accounting)?.id).toBe(
            'eth:eth:everstake:pooled',
        );
    });

    it('matches the pool contract', () => {
        expect(
            getStakingProductByEthereumContract(thodSymbol, EVERSTAKE_CONTRACTS[560048].pool)?.id,
        ).toBe('thod:thod:everstake:pooled');
    });

    it('does not match a deployment from another network', () => {
        expect(
            getStakingProductByEthereumContract(thodSymbol, EVERSTAKE_CONTRACTS[1].accounting),
        ).toBeUndefined();
    });

    it('returns undefined for an unknown contract', () => {
        expect(getStakingProductByEthereumContract(ethSymbol, UNKNOWN_CONTRACT)).toBeUndefined();
    });
});

describe('product lookups by chain identity', () => {
    it('resolves each Solana validator to the product of its network', () => {
        expect(getStakingProductBySolanaVoterPubkey(EVERSTAKE_SOLANA_MAINNET_VALIDATOR)?.id).toBe(
            'sol:sol:everstake:native',
        );
        expect(getStakingProductBySolanaVoterPubkey(EVERSTAKE_SOLANA_DEVNET_VALIDATOR)?.id).toBe(
            'dsol:dsol:everstake:native',
        );
        expect(getStakingProductBySolanaVoterPubkey('unknown')).toBeUndefined();
    });

    it('resolves Cardano pools to their provider products', () => {
        expect(getStakingProductByCardanoPoolId(EVERSTAKE_POOLS[0]!)?.id).toBe(
            'ada:ada:everstake:native',
        );
        expect(getStakingProductByCardanoPoolId(FIVE_BINARIES_POOLS[0]!)?.id).toBe(
            'ada:ada:fivebinaries:native',
        );
        expect(getStakingProductByCardanoPoolId('pool1unknown')).toBeUndefined();
    });

    it('resolves Tron Super Representatives to their provider products', () => {
        expect(getStakingProductByTronSrAddress(LUGANODES_TRON_SRS[0]!)?.id).toBe(
            'trx:trx:luganodes:native',
        );
        expect(getStakingProductByTronSrAddress(P2P_ORG_TRON_SRS[0]!)?.id).toBe(
            'trx:trx:p2p.org:native',
        );
        expect(getStakingProductByTronSrAddress('TUnknown')).toBeUndefined();
    });
});

describe('provider lookups by chain identity', () => {
    it('return the provider of the matching product', () => {
        expect(
            getStakingProviderByEthereumContract(ethSymbol, EVERSTAKE_CONTRACTS[1].pool)?.name,
        ).toBe('Everstake');
        expect(getStakingProviderBySolanaVoterPubkey(EVERSTAKE_SOLANA_MAINNET_VALIDATOR)?.id).toBe(
            'everstake',
        );
        expect(getStakingProviderByCardanoPoolId(FIVE_BINARIES_POOLS[0]!)?.id).toBe('fivebinaries');
        expect(getStakingProviderByTronSrAddress(P2P_ORG_TRON_SRS[0]!)?.id).toBe('p2p.org');
    });

    it('return undefined when no product matches', () => {
        expect(getStakingProviderByEthereumContract(ethSymbol, UNKNOWN_CONTRACT)).toBeUndefined();
        expect(getStakingProviderByTronSrAddress('TUnknown')).toBeUndefined();
    });
});
