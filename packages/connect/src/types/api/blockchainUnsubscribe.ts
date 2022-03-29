import type { BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { Response } from '../params';
import type { BlockchainSubscribe } from './blockchainSubscribe';

export declare function blockchainUnsubscribe(
    params: BlockchainSubscribe,
): Response<BlockchainLinkResponse<'unsubscribe'>>;
