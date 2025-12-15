import { type AnimatedProps, FadeIn, FadeOutDown } from 'react-native-reanimated';

import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useExchangeSelectQuote } from '../../hooks/exchange/useExchangeSelectQuote';
import { getApprovalStatus } from '../../utils/general/approvalStatusUtils';

export type ExchangeConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

const CONFIRMATION_TEST_ID = '@trading/exchange/continue-button';

export const ExchangeConfirmation = ({ enteringAnimation }: ExchangeConfirmationProps) => {
    const form = useExchangeFormContext();

    const { canProceed, selectQuote } = useExchangeSelectQuote(form);

    const quote = form.watch('quote');
    const approvalStatus = getApprovalStatus(quote);

    return (
        <AnimatedBox entering={enteringAnimation} exiting={FadeOutDown}>
            {canProceed && (
                <AnimatedBox entering={FadeIn}>
                    <Button onPress={selectQuote} testID={CONFIRMATION_TEST_ID}>
                        {approvalStatus === 'needs_approval' ? (
                            <Translation id="moduleTrading.tradingScreen.buttons.approveAndSwap" />
                        ) : (
                            <Translation id="moduleTrading.tradingScreen.buttons.swap" />
                        )}
                    </Button>
                </AnimatedBox>
            )}
        </AnimatedBox>
    );
};
