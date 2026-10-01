import { ApproveOverBalanceWarning } from './ApproveOverBalanceWarning';
import { ApproveStepWarningsProvider } from './ApproveStepWarningsContext/ApproveStepWarningsContext';
import { FeeReserveTopUpWarning } from './FeeReserveTopUpWarning/FeeReserveTopUpWarning';
import { InsufficientFeeReserveWarning } from './InsufficientFeeReserveWarning/InsufficientFeeReserveWarning';

// Each warning decides on its own whether it renders; their conditions exclude each other, giving
// way in the order they are listed.
export const ApproveStepWarnings = () => (
    <ApproveStepWarningsProvider>
        <InsufficientFeeReserveWarning />
        <ApproveOverBalanceWarning />
        <FeeReserveTopUpWarning />
    </ApproveStepWarningsProvider>
);
