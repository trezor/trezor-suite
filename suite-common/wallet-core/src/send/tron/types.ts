import { type BlockchainLinkResponse } from '@trezor/blockchain-link';

export type EstimateFeeLevel = BlockchainLinkResponse<'estimateFee'>[number];
