import { type JsonRpcScanParams } from '@blockaid/client/resources/evm';

import { U_INT_32 } from '@suite-common/wallet-constants';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';

import { resolveBlockaidEvmChain } from '../chains';

function transformPayloadOfEthereumSignTransaction({
    payload: { transaction },
    fromAddress,
    sourceOrigin,
}: TxSimulationMethod<'ethereumSignTransaction'>) {
    const chain = resolveBlockaidEvmChain(transaction.chainId);

    if (!chain) {
        return null;
    }

    return {
        chain,
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
    const chain = resolveBlockaidEvmChain(
        data.domain.chainId ? Number(data.domain.chainId) : undefined,
    );

    if (!chain) {
        return null;
    }

    return {
        chain,
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
export function getTxSimulationParams(action: TxSimulationAction | null) {
    if (!action) {
        return null;
    }

    switch (action.method) {
        case 'ethereumSignTransaction': {
            const params = transformPayloadOfEthereumSignTransaction(action);

            return params && ({ method: action.method, params } as const);
        }
        case 'ethereumSignTypedData': {
            const params = transformPayloadOfEthereumSignTypedData(action);

            return params && ({ method: action.method, params } as const);
        }
        default:
            return null;
    }
}

export type GetTxSimulationParams = ReturnType<typeof getTxSimulationParams>;
