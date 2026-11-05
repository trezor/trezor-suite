import type {
    StakingProductAdapter,
    StakingProductDescriptor,
    StakingProvider,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import { createSolanaExternalDelegationProduct } from './createSolanaExternalDelegationProduct';
import {
    type SolanaNativeDelegationProductDeps,
    createSolanaNativeDelegationProduct,
} from './createSolanaNativeDelegationProduct';
import { EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES } from './solanaDelegationDescriptors';
import { everstakeProvider } from '../providers/everstake';

export type CreateSolanaProductsDeps = SolanaNativeDelegationProductDeps;

export type CreateSolanaProductsParams = CreateSolanaProductsDeps & {
    networkSymbol: NetworkSymbol;
};

type SolanaValidatorProduct = {
    provider: StakingProvider;
    messageSystemFeaturesBySymbol: Partial<
        Record<NetworkSymbol, StakingProductDescriptor['messageSystemFeatures']>
    >;
};

// Every validator Suite offers on Solana. The external product owns the stake none of them owns, so
// adding a validator here also takes its stake out of the external position. The message system has
// no devnet keys, so only mainnet operations can be switched off remotely.
const SOLANA_VALIDATOR_PRODUCTS: readonly SolanaValidatorProduct[] = [
    {
        provider: everstakeProvider,
        messageSystemFeaturesBySymbol: {
            [asNetworkSymbol('sol')]: EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES,
        },
    },
];

export const createSolanaProducts = ({
    networkSymbol,
    ...deps
}: CreateSolanaProductsParams): readonly StakingProductAdapter[] => [
    ...SOLANA_VALIDATOR_PRODUCTS.map(({ provider, messageSystemFeaturesBySymbol }) =>
        createSolanaNativeDelegationProduct({
            networkSymbol,
            provider,
            messageSystemFeatures: messageSystemFeaturesBySymbol[networkSymbol] ?? {},
            ...deps,
        }),
    ),
    createSolanaExternalDelegationProduct({
        networkSymbol,
        managedProviders: SOLANA_VALIDATOR_PRODUCTS.map(({ provider }) => provider),
    }),
];
