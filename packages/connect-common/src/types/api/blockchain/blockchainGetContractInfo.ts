import type { BlockchainLinkResponse } from '@trezor/blockchain-link';
import { type ContractInfoParams } from '@trezor/blockchain-link-types/src/blockbook';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export declare function blockchainGetContractInfo(
    params: DeviceFreeCommonParamsWithCoin & ContractInfoParams,
): Response<BlockchainLinkResponse<'getContractInfo'>>;
