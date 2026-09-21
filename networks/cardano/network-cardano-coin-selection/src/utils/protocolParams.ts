import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import type { Options, ProtocolParams } from '../types/types';

/**
 * Cardano mainnet protocol parameters as of epoch 656 (September 2026). Used as a fallback when
 * the caller does not provide live values; live values must be preferred whenever available
 * because these change through on-chain governance.
 */
export const DEFAULT_PROTOCOL_PARAMS: ProtocolParams = {
    minFeeA: '44',
    minFeeB: '155381',
    keyDeposit: '2000000',
    poolDeposit: '500000000',
    coinsPerUtxoByte: '4310',
    maxValueSize: 5000,
    maxTxSize: 16384,
};

export const getProtocolParams = (options?: Options): ProtocolParams => {
    const protocolParams = options?.protocolParams ?? DEFAULT_PROTOCOL_PARAMS;

    return {
        ...protocolParams,
        minFeeA: options?.feeParams?.a ?? protocolParams.minFeeA,
    };
};

export const getDataCost = (protocolParams: ProtocolParams): CardanoWasm.DataCost =>
    CardanoWasm.DataCost.new_coins_per_byte(
        CardanoWasm.BigNum.from_str(protocolParams.coinsPerUtxoByte),
    );
