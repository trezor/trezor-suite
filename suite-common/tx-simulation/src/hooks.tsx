import { useMemo } from 'react';

import type {
    AccountSummary,
    JsonRpcScanParams,
    TransactionSimulation,
} from '@blockaid/client/resources/evm';

import { ConnectPopupCall } from '@suite-common/connect-popup';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { getNetwork, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import type { EthereumSignTransaction, EthereumSignTypedData } from '@trezor/connect';

import { client } from './client';

export type { TransactionSimulation, AccountSummary };

function useTxSimulationEVM(
    input?: JsonRpcScanParams,
    onSuccess?: (result: TxSimulationResult) => void,
) {
    return useQuery({
        enabled: Boolean(input),
        queryKey: commonQueryKeys.txSimulationEVM(input),
        queryFn: async () => {
            const simulationResult = await client.evm.jsonRpc.scan(input!);
            const needsDisclaimer =
                simulationResult.validation?.result_type === 'Malicious' ||
                simulationResult.validation?.result_type === 'Warning' ||
                simulationResult.simulation?.status === 'Error';

            const result = {
                ...simulationResult,
                needsDisclaimer,
            };

            onSuccess?.(result);

            return result;
        },
    });
}

export type TxSimulationResult = NonNullable<ReturnType<typeof useTxSimulationEVM>['data']>;

interface UseTxSimulationConnectPopupProps {
    onTxSimulationSuccess?: (result: TxSimulationResult) => void;
}

export const useTxSimulationConnectPopup = (
    popupCall: ConnectPopupCall | undefined,
    { onTxSimulationSuccess }: UseTxSimulationConnectPopupProps = {},
) => {
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

    const txSimulationQuery = useTxSimulationEVM(payload, onTxSimulationSuccess);

    return {
        txSimulationQuery,
        network,
        targetContract,
    };
};

export const useDappScan = (url?: string) =>
    useQuery({
        enabled: Boolean(url),
        queryKey: commonQueryKeys.dappScan(url),
        queryFn: async () => {
            const scanResult = await client.site.scan({ url: url! });
            const isMalicious = scanResult?.status === 'hit' && scanResult.is_malicious;

            return {
                ...scanResult,
                isMalicious,
            };
        },
    });
