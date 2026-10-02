import { YieldApprovalInsufficientWarning } from './YieldApprovalInsufficientWarning';
import { YieldApproveOverBalanceWarning } from './YieldApproveOverBalanceWarning';
import { YieldInsufficientFundsWarning } from './YieldInsufficientFundsWarning';
import {
    type YieldReserveRecommendation,
    YieldReserveRecommendationWarning,
} from './YieldReserveRecommendationWarning';

type YieldActionStepWarningProps = {
    isInsufficientFunds?: boolean;
    isApprovalInsufficient?: boolean;
    isApproveOverBalance?: boolean;
    /** Non-blocking recommendation to keep a native-coin reserve aside for the follow-up fees. */
    reserveRecommendation?: YieldReserveRecommendation;
    onModifyApproval?: () => void;
};

export function YieldActionStepWarning({
    isInsufficientFunds = false,
    isApprovalInsufficient = false,
    isApproveOverBalance = false,
    reserveRecommendation,
    onModifyApproval,
}: YieldActionStepWarningProps) {
    if (reserveRecommendation) {
        return <YieldReserveRecommendationWarning reserveRecommendation={reserveRecommendation} />;
    }

    if (isApproveOverBalance) {
        return <YieldApproveOverBalanceWarning />;
    }

    if (isApprovalInsufficient) {
        return <YieldApprovalInsufficientWarning onModifyApproval={onModifyApproval} />;
    }

    if (isInsufficientFunds) {
        return <YieldInsufficientFundsWarning />;
    }

    return null;
}
