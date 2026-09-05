import { type Network, getNetwork, getNetworkByEvmChainId } from '@suite-common/wallet-config';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';
import { type NetworkChainId, asNetworkChainId } from '@trezor/network-module-suite-common-types';

const ethereumMainnetChainId = asNetworkChainId(1);

export {
    getEvmSimulationSummary,
    getSolanaAssetDiffs,
    getStellarAssetDiffs,
    type EvmSimulationSummary,
} from './getSimulationAssetDiffs';
export { getTxSimulationParams, type GetTxSimulationParams } from './getTxSimulationParams';
export {
    getEvmSimulationFailure,
    getSolanaSimulationFailure,
    getStellarSimulationFailure,
    getTxSimulationDisclaimerKey,
    getTxSimulationRiskSummary,
    type TxSimulationRiskSummary,
    type TxSimulationFailure,
    type TxSimulationValidationFeature,
    type TxSimulationValidationSummary,
} from './getTxSimulationRiskSummary';

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
}: TxSimulationMethod<'ethereumSignTransaction' | 'ethereumSignTypedData'>): NetworkChainId {
    switch (method) {
        case 'ethereumSignTransaction':
            return asNetworkChainId(payload.transaction.chainId);
        case 'ethereumSignTypedData':
            return asNetworkChainId(Number(payload.data.domain.chainId ?? ethereumMainnetChainId));
        default:
            return ethereumMainnetChainId;
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

        case 'solanaSignTransaction':
        case 'stellarSignTransaction':
            return getNetwork(action.symbol);

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
