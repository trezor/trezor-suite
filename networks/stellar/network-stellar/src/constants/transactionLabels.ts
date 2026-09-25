import type { StellarClaimableBalanceOffer, StellarOperationType } from '../types/operations';

export type StellarOperationLabel =
    | 'accountMerge'
    | 'claimableBalanceClaimed'
    | 'claimableBalanceCreated'
    | 'claimableBalanceOffered'
    | 'dataEntry'
    | 'footprint'
    | 'liquidityPool'
    | 'offer'
    | 'sequenceBumped'
    | 'setOptions'
    | 'sponsorship'
    | 'trustlineFlags'
    | 'trustlineUpdated';

type StellarOperationSummary = {
    operationType?: StellarOperationType;
    changeTrust?: object;
    claimableBalanceOffer?: Pick<StellarClaimableBalanceOffer, 'isClaimant'>;
};

/** Names a transaction by its operation; `undefined` leaves the wording to the amounts moved. */
export const getStellarOperationLabel = ({
    operationType,
    changeTrust,
    claimableBalanceOffer,
}: StellarOperationSummary): StellarOperationLabel | undefined => {
    switch (operationType) {
        case 'accountMerge':
            return 'accountMerge';
        case 'allowTrust':
        case 'trustLineFlags':
            return 'trustlineFlags';
        case 'bumpSequence':
            return 'sequenceBumped';
        // A liquidity-pool share has no asset code, so the detailed trustline wording cannot be built.
        case 'changeTrust':
            return changeTrust ? undefined : 'trustlineUpdated';
        case 'claimClaimableBalance':
            return 'claimableBalanceClaimed';
        case 'createClaimableBalance':
            return claimableBalanceOffer?.isClaimant
                ? 'claimableBalanceOffered'
                : 'claimableBalanceCreated';
        case 'footprint':
            return 'footprint';
        case 'liquidityPool':
            return 'liquidityPool';
        case 'manageData':
            return 'dataEntry';
        case 'offer':
            return 'offer';
        case 'setOptions':
            return 'setOptions';
        case 'sponsorship':
            return 'sponsorship';
        default:
            return undefined;
    }
};
