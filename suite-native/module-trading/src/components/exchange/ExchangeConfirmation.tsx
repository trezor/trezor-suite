import {
    type AnimatedProps,
    FadeIn,
    FadeOut,
    FadeOutDown,
    LinearTransition,
} from 'react-native-reanimated';

import { type ApprovalStatus, getApprovalStatus } from '@suite-common/trading';
import { AnimatedBox, AnimatedVStack, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useExchangeSelectQuote } from '../../hooks/exchange/useExchangeSelectQuote';

export type ExchangeConfirmationProps = {
    enteringAnimation?: AnimatedProps<any>['entering'];
};

export const CONFIRMATION_TEST_ID = '@trading/exchange/continue-button';
export const REVOKE_TEST_ID = '@trading/exchange/revoke-button';

export const ExchangeConfirmation = ({ enteringAnimation }: ExchangeConfirmationProps) => {
    const form = useExchangeFormContext();

    const { canProceed, selectQuote } = useExchangeSelectQuote(form);

    const quote = form.watch('quote');
    const approvalStatus = getApprovalStatus(quote);
    const canRevoke = (['approved', 'needs_increase', 'needs_revoke'] as ApprovalStatus[]).includes(
        approvalStatus,
    );

    return (
        <AnimatedVStack entering={enteringAnimation} exiting={FadeOutDown} spacing="sp16">
            {canProceed && (
                <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
                    <Button onPress={selectQuote} testID={CONFIRMATION_TEST_ID}>
                        <Translation id="moduleTrading.tradingScreen.buttons.continue" />
                    </Button>
                </AnimatedBox>
            )}
            {canRevoke && (
                <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
                    <Button
                        onPress={() => {}}
                        testID={REVOKE_TEST_ID}
                        colorScheme="tertiaryElevation0"
                    >
                        <Translation id="moduleTrading.tradingScreen.buttons.revoke" />
                    </Button>
                </AnimatedBox>
            )}
        </AnimatedVStack>
    );
};
