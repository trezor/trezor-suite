import { InsufficientFeeReserveWarning } from './InsufficientFeeReserveWarning/InsufficientFeeReserveWarning';
import { InsufficientFundsWarning } from './InsufficientFundsWarning/InsufficientFundsWarning';
import { ReserveKeptWarning } from './ReserveKeptWarning/ReserveKeptWarning';
import { ReserveRecommendationWarning } from './ReserveRecommendationWarning/ReserveRecommendationWarning';
import { WrapStepWarningsProvider } from './WrapStepWarningsContext/WrapStepWarningsContext';

// Each warning decides on its own whether it renders; their conditions exclude each other, giving
// way in the order they are listed.
export const WrapStepWarnings = () => (
    <WrapStepWarningsProvider>
        <InsufficientFeeReserveWarning />
        <InsufficientFundsWarning />
        <ReserveKeptWarning />
        <ReserveRecommendationWarning />
    </WrapStepWarningsProvider>
);
