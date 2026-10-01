import { ActionStepWarningsProvider } from './ActionStepWarningsContext/ActionStepWarningsContext';
import { ApprovalTooLowWarning } from './ApprovalTooLowWarning/ApprovalTooLowWarning';
import { FeeReserveTopUpWarning } from './FeeReserveTopUpWarning/FeeReserveTopUpWarning';
import { InsufficientFeeReserveWarning } from './InsufficientFeeReserveWarning/InsufficientFeeReserveWarning';
import { InsufficientFundsWarning } from './InsufficientFundsWarning/InsufficientFundsWarning';

// Each warning decides on its own whether it renders; their conditions exclude each other, giving
// way in the order they are listed.
export const ActionStepWarnings = () => (
    <ActionStepWarningsProvider>
        <InsufficientFeeReserveWarning />
        <ApprovalTooLowWarning />
        <InsufficientFundsWarning />
        <FeeReserveTopUpWarning />
    </ActionStepWarningsProvider>
);
