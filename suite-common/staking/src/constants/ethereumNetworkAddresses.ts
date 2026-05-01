import { type EthNetwork } from '../types';

export type EthNetworkAddresses = {
    addressContractAccounting: string;
    addressContractPool: string;
    addressContractWithdrawTreasury: string;
};

export const ETH_NETWORK_ADDRESSES: Record<EthNetwork, EthNetworkAddresses> = {
    mainnet: {
        addressContractAccounting: '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e',
        addressContractPool: '0xD523794C879D9eC028960a231F866758e405bE34',
        addressContractWithdrawTreasury: '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
    },
    hoodi: {
        addressContractAccounting: '0x6Cf2F03804b171ef9CAFC71e302CA0e08A3FDC28',
        addressContractPool: '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3',
        addressContractWithdrawTreasury: '0xCDd543223b6ef6CE26E7f80F7837c5C1A88aF683',
    },
};
