import { type EthereumTransfer, isEthereumTransferUnsettled } from './migrationState';
import type { EthereumScannedAddress } from '../discovery/discoverEthereumAddresses';
import type { EthereumTokenBalance } from '../ethereum/ethereumAccountInfo';

export type EthereumTransferSummary = {
    /** Transfers the page saw on the network. */
    sent: EthereumTransfer[];
    /**
     * Addresses with coins that were found but not seen moving: not signed, signed but not seen
     * on the network, or failed to prepare.
     */
    notSent: EthereumTransfer[];
    /** Balances deliberately left behind because they do not cover their own fee, in wei. */
    leftoverAmounts: string[];
    /** ERC-20 balances of the scanned addresses. This tool never moves them. */
    tokens: EthereumTokenBalance[];
    hasPending: boolean;
    /** True only when every transfer that was needed has been sent and is confirmed. */
    isEverythingConfirmed: boolean;
};

export type SummarizeEthereumTransfersParams = {
    transfers: readonly EthereumTransfer[];
    addresses: readonly EthereumScannedAddress[];
};

/**
 * What the last screen may claim. It must never say that the found funds were transferred
 * while coins of a scanned address are still on the old device for a reason the user did not
 * choose.
 */
export const summarizeEthereumTransfers = ({
    transfers,
    addresses,
}: SummarizeEthereumTransfersParams): EthereumTransferSummary => {
    const sent = transfers.filter(({ stage }) => stage === 'on-network');
    // A transfer without a plan counts only when preparing it failed or is still waiting on a
    // pending transaction. Without either the address simply holds nothing that can be moved.
    const notSent = transfers.filter(
        ({ stage, plan, error, isInFlight }) =>
            stage !== 'on-network' && (plan !== undefined || error !== undefined || isInFlight),
    );
    const leftoverAmounts = transfers.flatMap(({ leftover }) =>
        leftover ? [leftover.balance] : [],
    );
    const tokens = addresses.flatMap(({ info }) => info.tokens);
    const hasPending = transfers.some(isEthereumTransferUnsettled);

    return {
        sent,
        notSent,
        leftoverAmounts,
        tokens,
        hasPending,
        isEverythingConfirmed:
            sent.length > 0 &&
            sent.every(({ status }) => status === 'confirmed') &&
            notSent.length === 0 &&
            !hasPending,
    };
};
