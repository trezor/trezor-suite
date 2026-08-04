import { type JsonRpcScanParams } from '@blockaid/client/resources/evm';

import type { GetNetworkConfigDep } from '@suite-common/networks';
import { getNetworkChainId } from '@suite-common/wallet-config';
import { U_INT_32 } from '@suite-common/wallet-constants';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';

// Maps EVM chainId to Blockaid's canonical chain name.
const createBlockaidEvmChainByChainId = (
    deps: GetNetworkConfigDep,
): Readonly<Record<number, JsonRpcScanParams['chain']>> => ({
    [getNetworkChainId(deps, 'eth')]: 'ethereum',
    [getNetworkChainId(deps, 'op')]: 'optimism',
    [getNetworkChainId(deps, 'bsc')]: 'bsc',
    [getNetworkChainId(deps, 'etc')]: 'ethereumClassic',
    [getNetworkChainId(deps, 'pol')]: 'polygon',
    [getNetworkChainId(deps, 'base')]: 'base',
    [getNetworkChainId(deps, 'arb')]: 'arbitrum',
    [getNetworkChainId(deps, 'rhc')]: 'robinhood',
    [getNetworkChainId(deps, 'hype')]: 'hyperevm',
    [getNetworkChainId(deps, 'avax')]: 'avalanche',
});

const resolveBlockaidEvmChain = (
    deps: GetNetworkConfigDep,
    chainId: number | undefined = 1,
): JsonRpcScanParams['chain'] =>
    createBlockaidEvmChainByChainId(deps)[chainId] as JsonRpcScanParams['chain'];

function transformPayloadOfEthereumSignTransaction(
    {
        payload: { transaction },
        fromAddress,
        sourceOrigin,
    }: TxSimulationMethod<'ethereumSignTransaction'>,
    deps: GetNetworkConfigDep,
) {
    return {
        chain: resolveBlockaidEvmChain(deps, transaction.chainId),
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

function transformPayloadOfEthereumSignTypedData(
    { payload: { data }, fromAddress, sourceOrigin }: TxSimulationMethod<'ethereumSignTypedData'>,
    deps: GetNetworkConfigDep,
) {
    return {
        chain: resolveBlockaidEvmChain(
            deps,
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
export function getTxSimulationParams(
    deps: GetNetworkConfigDep,
    action: TxSimulationAction | null,
) {
    if (!action) {
        return null;
    }

    switch (action.method) {
        case 'ethereumSignTransaction':
            return {
                method: action.method,
                params: transformPayloadOfEthereumSignTransaction(action, deps),
            } as const;
        case 'ethereumSignTypedData':
            return {
                method: action.method,
                params: transformPayloadOfEthereumSignTypedData(action, deps),
            } as const;
        default:
            return null;
    }
}

export type GetTxSimulationParams = ReturnType<typeof getTxSimulationParams>;
