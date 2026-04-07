import type { TronContracts } from '@trezor/connect-common/src/types/api/tron';

import { TRON_BANDWIDTH_FORMULA_OVERHEAD, encodeTronContractRawData } from './tronEncode';

const TRON_DUMMY_ADDRESS = '410000000000000000000000000000000000000000'; // Tron zero address
const TRON_DUMMY_BLOCK_BYTES = '0000';
const TRON_DUMMY_BLOCK_HASH = '0000000000000000';
const TRON_DUMMY_TIMESTAMP = 1700000000000;
const TRON_DUMMY_FEE_LIMIT = 50_000_000;

const DUMMY_BLOCK_PARAMS = {
    ref_block_bytes: TRON_DUMMY_BLOCK_BYTES,
    ref_block_hash: TRON_DUMMY_BLOCK_HASH,
    expiration: TRON_DUMMY_TIMESTAMP + 3_600_000,
    timestamp: TRON_DUMMY_TIMESTAMP,
    fee_limit: TRON_DUMMY_FEE_LIMIT,
};

export const estimateTronTransferBandwidth = (amountInSun: string): number => {
    const rawData = encodeTronContractRawData(
        {
            type: 'TransferContract',
            parameter: {
                value: {
                    owner_address: TRON_DUMMY_ADDRESS,
                    to_address: TRON_DUMMY_ADDRESS,
                    amount: amountInSun,
                },
            },
        },
        DUMMY_BLOCK_PARAMS,
    );

    return rawData.length + TRON_BANDWIDTH_FORMULA_OVERHEAD;
};

export const estimateTronTrc20Bandwidth = (data: string): number => {
    const rawData = encodeTronContractRawData(
        {
            type: 'TriggerSmartContract',
            parameter: {
                value: {
                    owner_address: TRON_DUMMY_ADDRESS,
                    contract_address: TRON_DUMMY_ADDRESS,
                    data,
                },
            },
        },
        DUMMY_BLOCK_PARAMS,
    );

    return rawData.length + TRON_BANDWIDTH_FORMULA_OVERHEAD;
};

export const estimateTronBandwidth = (contract: TronContracts): number => {
    switch (contract.type) {
        case 'TransferContract':
            return estimateTronTransferBandwidth(String(contract.parameter.value.amount ?? 0));

        case 'TriggerSmartContract':
            return estimateTronTrc20Bandwidth(contract.parameter.value.data ?? '');

        default:
            throw new Error(`Unsupported contract type for bandwidth estimation: ${contract.type}`);
    }
};
