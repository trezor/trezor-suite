import type { EverstakeContracts } from '../types';

export const EVERSTAKE_STAKING_POOL_NAME = 'Everstake';

export const EVERSTAKE_CHAIN_IDS = [1, 560048] as const;

export type EverstakeChainId = (typeof EVERSTAKE_CHAIN_IDS)[number];

// Mainnet and Hoodi deployments of the Everstake pooled staking contracts.
export const EVERSTAKE_CONTRACTS: Readonly<Record<EverstakeChainId, EverstakeContracts>> = {
    1: {
        pool: '0xD523794C879D9eC028960a231F866758e405bE34',
        accounting: '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e',
        withdrawTreasury: '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
    },
    560048: {
        pool: '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3',
        accounting: '0x6Cf2F03804b171ef9CAFC71e302CA0e08A3FDC28',
        withdrawTreasury: '0xCDd543223b6ef6CE26E7f80F7837c5C1A88aF683',
    },
};

export const isEverstakeChainId = (chainId: number): chainId is EverstakeChainId =>
    (EVERSTAKE_CHAIN_IDS as readonly number[]).includes(chainId);

export const getEverstakeContracts = (chainId: number): EverstakeContracts | undefined =>
    isEverstakeChainId(chainId) ? EVERSTAKE_CONTRACTS[chainId] : undefined;
