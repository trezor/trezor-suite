import type { BlockchainLinkResponse } from '@trezor/blockchain-link';
import { type ContractInfoParams } from '@trezor/blockchain-link-types/src/blockbook';

import type { CommonParamsWithCoin, Response } from '../params';

export declare function blockchainGetContractInfo(
    params: CommonParamsWithCoin & ContractInfoParams,
): Response<BlockchainLinkResponse<'getContractInfo'>>;
