import { useMemo } from 'react';

import { type JsonRpcScanParams } from '@blockaid/client/resources/evm';

import { U_INT_32 } from '@suite-common/wallet-constants';
import { type NetworkConfig } from '@suite-common/wallet-config';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';

type ChainId = Extract<NetworkConfig, { networkType: 'ethereum'; testnet: false }>['chainId'];

// Maps EVM chainId to Blockaid's canonical chain name.
const BLOCKAID_EVM_CHAIN_BY_CHAIN_ID = {
    1: 'ethereum',
    10: 'optimism',
    56: 'bsc',
    61: 'ethereumClassic',
    137: 'polygon',
    8453: 'base',
    42161: 'arbitrum',
    43114: 'avalanche',
} as const satisfies Readonly<Record<ChainId, string>>;

const resolveBlockaidEvmChain = (chainId: number | undefined = 1) =>
    BLOCKAID_EVM_CHAIN_BY_CHAIN_ID[chainId as keyof typeof BLOCKAID_EVM_CHAIN_BY_CHAIN_ID];

function transformPayloadOfEthereumSignTransaction({
    payload: { transaction },
    fromAddress,
    sourceOrigin,
}: TxSimulationMethod<'ethereumSignTransaction'>) {
    return {
        chain: resolveBlockaidEvmChain(transaction.chainId),
        data: {
            method: 'eth_sendTransaction',
            params: [
                {
                    from: fromAddress,
                    to: transaction.to || '',
                    value: transaction.value || '0x0',
                    data: transaction.data || '0x',
                    // Ensure a high gas limit to prevent out of gas errors during simulation
                    gas: `0x${U_INT_32.toString(16)}`,
                },
            ],
        },
        account_address: fromAddress,
        metadata: {
            domain: sourceOrigin,
            non_dapp: true,
        },
        options: ['validation', 'simulation', 'gas_estimation'],
        block: 'latest',
        simulate_with_estimated_gas: true,
    } as const satisfies JsonRpcScanParams;
}

function transformPayloadOfEthereumSignTypedData({
    payload: { data },
    fromAddress,
    sourceOrigin,
}: TxSimulationMethod<'ethereumSignTypedData'>) {
    return {
        chain: resolveBlockaidEvmChain(
            data.domain.chainId ? Number(data.domain.chainId) : undefined,
        ),
        data: {
            method: 'eth_signTypedData_v4',
            params: [fromAddress, JSON.stringify(data)],
        },
        account_address: fromAddress,
        metadata: {
            domain: sourceOrigin,
            non_dapp: true,
        },
        options: ['validation', 'simulation', 'gas_estimation'],
        block: 'latest',
        simulate_with_estimated_gas: true,
    } as const satisfies JsonRpcScanParams;
}

/**
 * Transform payload to the format expected by the tx simulation API.
 */
export function useTxSimulationParams(action: TxSimulationAction) {
    return useMemo(() => {
        switch (action.method) {
            case 'ethereumSignTransaction':
                return {
                    method: action.method,
                    params: transformPayloadOfEthereumSignTransaction(action),
                } as const;
            case 'ethereumSignTypedData':
                return {
                    method: action.method,
                    params: transformPayloadOfEthereumSignTypedData(action),
                } as const;
            default:
                return null;
        }
    }, [action]);
}

export type UseTxSimulationParams = ReturnType<typeof useTxSimulationParams>;
