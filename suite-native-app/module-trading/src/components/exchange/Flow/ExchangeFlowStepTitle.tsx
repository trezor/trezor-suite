import { Translation } from '@suite-native/intl';
import { type ExchangeFlowApprovalStatus, type ExchangeFlowStep } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

export type ExchangeFlowStepTitleProps = {
    step: ExchangeFlowStep;
    approvalStatus: ExchangeFlowApprovalStatus;
};

export const ExchangeFlowStepTitle = ({ step, approvalStatus }: ExchangeFlowStepTitleProps) => {
    switch (step) {
        case 'revoke':
            return <Translation id="moduleTrading.tradingExchangeFlowScreen.stepTitles.revoke" />;
        case 'approval':
            return (
                <Translation
                    id={
                        approvalStatus === 'needs_increase'
                            ? 'moduleTrading.tradingExchangeFlowScreen.stepTitles.increaseLimit'
                            : 'moduleTrading.tradingExchangeFlowScreen.stepTitles.approve'
                    }
                />
            );
        case 'preview':
            return <Translation id="moduleTrading.tradingExchangeFlowScreen.stepTitles.swap" />;
        default:
            return exhaustive(step);
    }
};
