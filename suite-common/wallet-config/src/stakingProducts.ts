import { EVERSTAKE_CONTRACTS, type EverstakeContracts } from '@trezor/network-ethereum/staking';
import {
    EVERSTAKE_SOLANA_DEVNET_VALIDATOR,
    EVERSTAKE_SOLANA_MAINNET_VALIDATOR,
} from '@trezor/network-solana/constants';
import { type Branded, exhaustive } from '@trezor/type-utils';

import { type NetworkSymbol, asNetworkSymbol } from './networkTypes';
import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    LUGANODES_TRON_SRS,
    P2P_ORG_TRON_SRS,
} from './stakingProviderConstants';
import {
    type StakingProvider,
    type StakingProviderId,
    getStakingProvider,
} from './stakingProviders';

export type StakingProductKind = 'pooled' | 'liquid' | 'native';

export type StakingProductKey = {
    symbol: NetworkSymbol;
    /** The network symbol for the native coin, the token contract address otherwise. */
    asset: string;
    providerId: StakingProviderId;
    kind: StakingProductKind;
};

export type StakingProductId = string & Branded<'StakingProductId'>;

/** How the chain identifies the product; products sharing a type share their adapter. */
export type StakingProductIdentity =
    | { type: 'everstake-pool'; contracts: EverstakeContracts }
    | { type: 'solana-validator'; voterPubkeys: readonly string[] }
    | { type: 'cardano-pool'; poolIds: readonly string[] }
    | { type: 'tron-super-representative'; addresses: readonly string[] };

export type StakingProductIdentityType = StakingProductIdentity['type'];

export type StakingProduct = StakingProductKey & {
    id: StakingProductId;
    identity: StakingProductIdentity;
};

export const getStakingProductId = ({ symbol, asset, providerId, kind }: StakingProductKey) =>
    `${symbol}:${asset}:${providerId}:${kind}` as StakingProductId;

type CreateStakingProductParams = StakingProductKey & { identity: StakingProductIdentity };

const createStakingProduct = ({
    identity,
    ...key
}: CreateStakingProductParams): StakingProduct => ({
    ...key,
    id: getStakingProductId(key),
    identity,
});

const eth = asNetworkSymbol('eth');
const thod = asNetworkSymbol('thod');
const sol = asNetworkSymbol('sol');
const dsol = asNetworkSymbol('dsol');
const ada = asNetworkSymbol('ada');
const trx = asNetworkSymbol('trx');

export const STAKING_PRODUCTS: readonly StakingProduct[] = [
    createStakingProduct({
        symbol: eth,
        asset: eth,
        providerId: 'everstake',
        kind: 'pooled',
        identity: { type: 'everstake-pool', contracts: EVERSTAKE_CONTRACTS[1] },
    }),
    createStakingProduct({
        symbol: thod,
        asset: thod,
        providerId: 'everstake',
        kind: 'pooled',
        identity: { type: 'everstake-pool', contracts: EVERSTAKE_CONTRACTS[560048] },
    }),
    createStakingProduct({
        symbol: sol,
        asset: sol,
        providerId: 'everstake',
        kind: 'native',
        identity: { type: 'solana-validator', voterPubkeys: [EVERSTAKE_SOLANA_MAINNET_VALIDATOR] },
    }),
    createStakingProduct({
        symbol: dsol,
        asset: dsol,
        providerId: 'everstake',
        kind: 'native',
        identity: { type: 'solana-validator', voterPubkeys: [EVERSTAKE_SOLANA_DEVNET_VALIDATOR] },
    }),
    createStakingProduct({
        symbol: ada,
        asset: ada,
        providerId: 'everstake',
        kind: 'native',
        identity: { type: 'cardano-pool', poolIds: EVERSTAKE_POOLS },
    }),
    createStakingProduct({
        symbol: ada,
        asset: ada,
        providerId: 'fivebinaries',
        kind: 'native',
        identity: { type: 'cardano-pool', poolIds: FIVE_BINARIES_POOLS },
    }),
    createStakingProduct({
        symbol: trx,
        asset: trx,
        providerId: 'luganodes',
        kind: 'native',
        identity: { type: 'tron-super-representative', addresses: LUGANODES_TRON_SRS },
    }),
    createStakingProduct({
        symbol: trx,
        asset: trx,
        providerId: 'p2p.org',
        kind: 'native',
        identity: { type: 'tron-super-representative', addresses: P2P_ORG_TRON_SRS },
    }),
];

const NO_STAKING_PRODUCTS: readonly StakingProduct[] = [];

const stakingProductsById = new Map(STAKING_PRODUCTS.map(product => [product.id, product]));

const stakingProductsBySymbol = STAKING_PRODUCTS.reduce((productsBySymbol, product) => {
    productsBySymbol.set(product.symbol, [
        ...(productsBySymbol.get(product.symbol) ?? []),
        product,
    ]);

    return productsBySymbol;
}, new Map<NetworkSymbol, readonly StakingProduct[]>());

export const findStakingProduct = (id: StakingProductId): StakingProduct | undefined =>
    stakingProductsById.get(id);

export const listStakingProducts = (symbol: NetworkSymbol): readonly StakingProduct[] =>
    stakingProductsBySymbol.get(symbol) ?? NO_STAKING_PRODUCTS;

const getEthereumContracts = (identity: StakingProductIdentity): readonly string[] => {
    switch (identity.type) {
        case 'everstake-pool':
            return Object.values(identity.contracts);
        case 'solana-validator':
        case 'cardano-pool':
        case 'tron-super-representative':
            return [];
        default:
            return exhaustive(identity);
    }
};

export const getStakingProductByEthereumContract = (
    symbol: NetworkSymbol,
    contractAddress: string,
): StakingProduct | undefined => {
    const normalized = contractAddress.toLowerCase();

    return listStakingProducts(symbol).find(({ identity }) =>
        getEthereumContracts(identity).some(address => address.toLowerCase() === normalized),
    );
};

export const getStakingProductBySolanaVoterPubkey = (
    voterPubkey: string,
): StakingProduct | undefined =>
    STAKING_PRODUCTS.find(
        ({ identity }) =>
            identity.type === 'solana-validator' && identity.voterPubkeys.includes(voterPubkey),
    );

export const getStakingProductByCardanoPoolId = (poolId: string): StakingProduct | undefined =>
    STAKING_PRODUCTS.find(
        ({ identity }) => identity.type === 'cardano-pool' && identity.poolIds.includes(poolId),
    );

export const getStakingProductByTronSrAddress = (srAddress: string): StakingProduct | undefined =>
    STAKING_PRODUCTS.find(
        ({ identity }) =>
            identity.type === 'tron-super-representative' && identity.addresses.includes(srAddress),
    );

const getProductProvider = (product: StakingProduct | undefined): StakingProvider | undefined =>
    product ? getStakingProvider(product.providerId) : undefined;

export const getStakingProviderByEthereumContract = (
    symbol: NetworkSymbol,
    contractAddress: string,
): StakingProvider | undefined =>
    getProductProvider(getStakingProductByEthereumContract(symbol, contractAddress));

export const getStakingProviderBySolanaVoterPubkey = (
    voterPubkey: string,
): StakingProvider | undefined =>
    getProductProvider(getStakingProductBySolanaVoterPubkey(voterPubkey));

export const getStakingProviderByCardanoPoolId = (poolId: string): StakingProvider | undefined =>
    getProductProvider(getStakingProductByCardanoPoolId(poolId));

export const getStakingProviderByTronSrAddress = (srAddress: string): StakingProvider | undefined =>
    getProductProvider(getStakingProductByTronSrAddress(srAddress));
