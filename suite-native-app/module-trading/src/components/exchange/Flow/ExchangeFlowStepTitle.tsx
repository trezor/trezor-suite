import { Translation } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

import { type ExchangeFlowStep } from '../../../utils/exchange/exchangeFlowSteps';

export type ExchangeFlowStepTitleProps = {
    step: ExchangeFlowStep;
};

export const ExchangeFlowStepTitle = ({ step }: ExchangeFlowStepTitleProps) => {
    switch (step) {
        case 'revoke':
            return (
                <Translation id="moduleTrading.tradingExchangeFlowScreen.revokeStep.nextStepTitle" />
            );
        case 'approval':
            return (
                <Translation id="moduleTrading.tradingExchangeFlowScreen.approveStep.nextStepTitle" />
            );
        case 'preview':
            return (
                <Translation id="moduleTrading.tradingExchangeFlowScreen.swapStep.nextStepTitle" />
            );
        default:
            return exhaustive(step);
    }
};
