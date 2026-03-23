import { useMemo } from 'react';

import { type JsonRpcScanParams } from '@blockaid/client/resources/evm';

import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';

function transformPayloadOfEthereumSignTransaction({
    payload: { transaction },
    fromAddress,
    sourceOrigin,
}: TxSimulationMethod<'ethereumSignTransaction'>) {
    return {
        chain: transaction.chainId ? `${transaction.chainId}` : 'ethereum',
        data: {
            method: 'eth_sendTransaction',
            params: [
                {
                    from: fromAddress,
                    to: transaction.to || '',
                    value: transaction.value || '0x0',
                    data: transaction.data || '0x',
                    gas: transaction.gasLimit,
                },
            ],
        },
        account_address: fromAddress,
        metadata: { domain: sourceOrigin },
        options: ['validation', 'simulation', 'gas_estimation'],
        block: 'latest',
    } as const satisfies JsonRpcScanParams;
}

function transformPayloadOfEthereumSignTypedData({
    payload: { data },
    fromAddress,
    sourceOrigin,
}: TxSimulationMethod<'ethereumSignTypedData'>) {
    return {
        chain: data.domain.chainId ? `${data.domain.chainId}` : 'ethereum',
        data: {
            method: 'eth_signTypedData_v4',
            params: [fromAddress, JSON.stringify(data)],
        },
        account_address: fromAddress,
        metadata: { domain: sourceOrigin },
        options: ['validation', 'simulation', 'gas_estimation'] as const,
        block: 'latest',
    } as const satisfies JsonRpcScanParams;
}

/**
 * Transform payload to the format expected by the tx simulation API
 */
export function useTxSimulationPayload(action: TxSimulationAction) {
    return useMemo(() => {
        switch (action.method) {
            case 'ethereumSignTransaction':
                return transformPayloadOfEthereumSignTransaction(action);
            case 'ethereumSignTypedData':
                return transformPayloadOfEthereumSignTypedData(action);
            default:
                return null;
        }
    }, [action]);
}
