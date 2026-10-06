import type { ConfirmingScreenFlowType } from '@suite-native/navigation';

import { useExchangeConfirmationNavigation } from '../../../hooks/exchange/useExchangeConfirmationNavigation';

export type ExchangeConfirmationNavigatorProps = {
    flowType: ConfirmingScreenFlowType;
    isConfirmed: boolean;
};

export const ExchangeConfirmationNavigator = ({
    flowType,
    isConfirmed,
}: ExchangeConfirmationNavigatorProps) => {
    useExchangeConfirmationNavigation({ flowType, isConfirmed });

    return null;
};
