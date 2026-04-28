import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { type ApprovalStatus, getApprovalStatus } from '@suite-common/trading';
import { AnimatedBox, Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useExchangeSelectQuote } from '../../hooks/exchange/useExchangeSelectQuote';
import { useTradingStellarActivateToken } from '../../hooks/general/useTradingStellarActivateToken';

export const CONFIRMATION_TEST_ID = '@trading/exchange/continue-button';
export const REVOKE_TEST_ID = '@trading/exchange/revoke-button';

export const ExchangeConfirmation = () => {
    const form = useExchangeFormContext();
    const receiveAsset = form.watch('receiveAsset');
    const receiveCryptoId = receiveAsset?.cryptoId;

    const { canProceed, selectQuote, selectQuoteForRevoke } = useExchangeSelectQuote(form);

    const quote = form.watch('quote');
    const approvalStatus = getApprovalStatus(quote);
    const canRevoke =
        (['approved', 'needs_increase', 'needs_revoke'] as ApprovalStatus[]).includes(
            approvalStatus,
        ) && canProceed;

    const { isReceivingInactiveStellarToken, activateButtonElement } =
        useTradingStellarActivateToken({
            quote,
            receiveCryptoId,
            buttonTestId: CONFIRMATION_TEST_ID,
        });

    return (
        <VStack spacing="sp16">
            {isReceivingInactiveStellarToken ? (
                activateButtonElement
            ) : (
                <>
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
                                onPress={selectQuoteForRevoke}
                                testID={REVOKE_TEST_ID}
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id="moduleTrading.tradingScreen.buttons.revoke" />
                            </Button>
                        </AnimatedBox>
                    )}
                </>
            )}
        </VStack>
    );
};
