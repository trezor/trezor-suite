import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { type ApprovalStatus } from '@suite-common/trading';
import { AnimatedBox, Button } from '@suite-native/atoms';
import { useTradingDebugModeFlag } from '@suite-native/trading-debug';

import { isExchangeFlowApprovalStatus } from '../../utils/exchange/exchangeFlowApprovalStatus';

export const EXCHANGE_FLOW_DEBUG_BUTTON_TEST_ID = '@trading/exchange/flow-debug-button';

export type ExchangeFlowDebugButtonProps = {
    approvalStatus: ApprovalStatus;
    onPress: () => void;
};

export const ExchangeFlowDebugButton = ({
    approvalStatus,
    onPress,
}: ExchangeFlowDebugButtonProps) => {
    const isDebugModeEnabled = useTradingDebugModeFlag();

    if (!isDebugModeEnabled || !isExchangeFlowApprovalStatus(approvalStatus)) {
        return null;
    }

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <Button
                onPress={onPress}
                testID={EXCHANGE_FLOW_DEBUG_BUTTON_TEST_ID}
                intent="accentViolet"
                priority="secondary"
            >
                New flow
            </Button>
        </AnimatedBox>
    );
};
