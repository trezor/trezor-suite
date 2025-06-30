import { useEffect, useMemo, useRef, useState } from 'react';

import type { TransactionScanResponse } from '@blockaid/client/resources';
import type { JsonRpcScanParams } from '@blockaid/client/resources/evm';

import { ConnectPopupCall } from '@suite-common/connect-popup';
import { getNetwork, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import type { EthereumSignTransaction, EthereumSignTypedData } from '@trezor/connect';

import { client } from './client';

export const useTxSimulationEVM = (input?: JsonRpcScanParams) => {
    // Call tx simulation API with the provided input
    const [isLoading, setIsLoading] = useState(false);
    const [simulationResult, setSimulationResult] = useState<TransactionScanResponse | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const lastInput = useRef<JsonRpcScanParams | undefined>(undefined);

    useEffect(() => {
        if (!input) {
            setSimulationResult(null);
            setError(null);

            return;
        }
        // Avoid unnecessary re-fetching
        if (lastInput.current && JSON.stringify(lastInput.current) === JSON.stringify(input)) {
            return;
        }
        lastInput.current = input;
        setIsLoading(true);
        client.evm.jsonRpc
            .scan(input)
            .then(result => {
                setSimulationResult(result);
            })
            .catch(err => {
                setError(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [input]);

    const needsDisclaimer =
        error ||
        simulationResult?.simulation?.status === 'Error' ||
        simulationResult?.validation?.result_type === 'Malicious' ||
        simulationResult?.validation?.result_type === 'Warning';

    return {
        isLoading,
        simulationResult,
        error,
        needsDisclaimer,
    };
};

export const useTxSimulationConnectPopup = (popupCall?: ConnectPopupCall) => {
    const payload = useMemo(() => {
        // Transform payload to the format expected by the tx simulation API
        if (popupCall?.state !== 'tx-simulation' || !popupCall.payload) return undefined;

        if (popupCall.method === 'ethereumSignTransaction') {
            const typedPayload = popupCall.payload as any as EthereumSignTransaction;

            return {
                chain: typedPayload.transaction.chainId
                    ? `${typedPayload.transaction.chainId}`
                    : 'ethereum',
                data: {
                    method: 'eth_sendTransaction',
                    params: [
                        {
                            from: popupCall.fromAddress,
                            to: typedPayload.transaction.to || '',
                            value: typedPayload.transaction.value || '0x0',
                            data: typedPayload.transaction.data || '0x',
                            gas: typedPayload.transaction.gasLimit,
                        },
                    ],
                },
                account_address: popupCall.fromAddress,
                metadata: { domain: popupCall.source.origin },
                options: ['validation' as const, 'simulation' as const, 'gas_estimation' as const],
                block: 'latest',
            };
        }
        if (popupCall.method === 'ethereumSignTypedData') {
            const typedPayload = popupCall.payload as any as EthereumSignTypedData<any>;

            return {
                chain: typedPayload.data.domain.chainId
                    ? `${typedPayload.data.domain.chainId}`
                    : 'ethereum',
                data: {
                    method: 'eth_signTypedData_v4',
                    params: [popupCall.fromAddress, JSON.stringify(typedPayload.data)],
                },
                account_address: popupCall.fromAddress,
                metadata: { domain: popupCall.source.origin },
                options: ['validation' as const, 'simulation' as const, 'gas_estimation' as const],
                block: 'latest',
            };
        }
    }, [popupCall]);

    const network = useMemo(() => {
        // Get network based on the chainId from the payload, default to Ethereum mainnet
        if (popupCall && popupCall.state === 'tx-simulation' && popupCall.payload) {
            let chainId = 1;
            if (popupCall.method === 'ethereumSignTransaction') {
                chainId = Number(popupCall.payload.transaction.chainId);
            } else if (popupCall.method === 'ethereumSignTypedData') {
                chainId = Number(popupCall.payload.data.domain.chainId);
            }

            const found = getNetworkByEvmChainId(chainId);
            if (found) {
                return found;
            }
        }

        return getNetwork('eth');
    }, [popupCall]);
    const targetContract = useMemo(() => {
        // Get target contract address from the payload
        if (popupCall && popupCall.state === 'tx-simulation' && popupCall.payload) {
            if (popupCall.method === 'ethereumSignTransaction') {
                return popupCall.payload.transaction.to;
            } else if (popupCall.method === 'ethereumSignTypedData') {
                return popupCall.payload.data.domain.verifyingContract;
            }
        }
    }, [popupCall]);

    const result = useTxSimulationEVM(payload);

    return {
        ...result,
        network,
        targetContract,
    };
};
