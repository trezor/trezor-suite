import type { BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { BlockchainSubscribeFiatRates } from './blockchainSubscribeFiatRates';
import type { Response } from '../../params';

export declare function blockchainUnsubscribeFiatRates(
    params: BlockchainSubscribeFiatRates,
): Response<BlockchainLinkResponse<'unsubscribe'>>;
