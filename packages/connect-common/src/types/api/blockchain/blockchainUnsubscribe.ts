import type { BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { BlockchainSubscribe } from './blockchainSubscribe';
import type { Response } from '../../params';

export declare function blockchainUnsubscribe(
    params: BlockchainSubscribe,
): Response<BlockchainLinkResponse<'unsubscribe'>>;
