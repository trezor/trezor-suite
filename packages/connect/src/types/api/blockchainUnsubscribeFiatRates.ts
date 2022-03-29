import type { BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { Response } from '../params';
import type { BlockchainSubscribeFiatRates } from './blockchainSubscribeFiatRates';

export declare function blockchainUnsubscribeFiatRates(
    params: BlockchainSubscribeFiatRates,
): Response<BlockchainLinkResponse<'unsubscribe'>>;
