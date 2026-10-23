import {
    type NetworkSymbol,
    type StakingProduct,
    type StakingProductIdentity,
    listStakingProducts,
} from '@suite-common/wallet-config';

export type TronStakingProduct = StakingProduct & {
    identity: Extract<StakingProductIdentity, { type: 'tron-super-representative' }>;
};

const isTronStakingProduct = (product: StakingProduct): product is TronStakingProduct =>
    product.identity.type === 'tron-super-representative';

export const listTronStakingProducts = (symbol: NetworkSymbol): TronStakingProduct[] =>
    listStakingProducts(symbol).filter(isTronStakingProduct);

export const isTronProductSuperRepresentative = (product: TronStakingProduct, srAddress: string) =>
    product.identity.addresses.includes(srAddress);
