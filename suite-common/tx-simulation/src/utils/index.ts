import { type Network, getNetworkByEvmChainId, networks } from '@suite-common/wallet-config';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';

export function getTargetContractFromTxSimulationAction({
    method,
    payload,
}: TxSimulationAction): string | null {
    switch (method) {
        case 'ethereumSignTransaction':
            return payload.transaction.to;
        case 'ethereumSignTypedData':
            return payload.data.domain.verifyingContract ?? null;
        default:
            return null;
    }
}

function resolveChainIdOfEvmNetwork({
    method,
    payload,
}: TxSimulationMethod<'ethereumSignTransaction' | 'ethereumSignTypedData'>): number {
    switch (method) {
        case 'ethereumSignTransaction':
            return payload.transaction.chainId;
        case 'ethereumSignTypedData':
            return Number(payload.data.domain.chainId ?? networks.eth.chainId);
        default:
            return networks.eth.chainId;
    }
}

/**
 * Get network based on the tx simulation action, default to Ethereum mainnet.
 */
export function getNetworkFromTxSimulationAction(action: TxSimulationAction): Network | null {
    switch (action.method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData': {
            const chainId = resolveChainIdOfEvmNetwork(action);

            return getNetworkByEvmChainId(chainId) ?? null;
        }

        default:
            return null;
    }
}

export const getSimulationErrorRiskLevel = (message: string) => {
    if (message.includes('Unsupported EIP-712 message type')) {
        return 'warning';
    }

    return 'error';
};

export function areTxSimulationMethods<
    const Methods extends ReadonlyArray<TxSimulationAction['method']>,
>(
    supportedMethods: Methods,
    action?: TxSimulationAction,
): action is Methods[number] & TxSimulationMethod<Methods[number]> {
    return action ? supportedMethods.includes(action.method) : false;
}
