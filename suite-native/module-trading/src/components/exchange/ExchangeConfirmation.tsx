import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { type ApprovalStatus, getApprovalStatus } from '@suite-common/trading';
import { AnimatedBox, Button, VStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useExchangeSelectQuote } from '../../hooks/exchange/useExchangeSelectQuote';
import { useTradingStellarActivateToken } from '../../hooks/general/useTradingStellarActivateToken';

export const CONFIRMATION_TEST_ID = '@trading/exchange/continue-button';
export const REVOKE_TEST_ID = '@trading/exchange/revoke-button';

export const ExchangeConfirmation = () => {
    const form = useExchangeFormContext();
    const receiveAsset = useWatch({ name: 'receiveAsset', control: form.control });
    const quote = useWatch({ name: 'quote', control: form.control });

    const { canProceed, selectQuote, selectQuoteForRevoke, isLoading } =
        useExchangeSelectQuote(form);

    const receiveCryptoId = receiveAsset?.cryptoId;
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

    if (!isLoading && !canProceed && !canRevoke && !isReceivingInactiveStellarToken) {
        return null;
    }

    return (
        <>
            {isReceivingInactiveStellarToken ? (
                activateButtonElement
            ) : (
                <VStack spacing="sp16">
                    <AnimatedBox entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
                        <Button
                            onPress={selectQuote}
                            testID={CONFIRMATION_TEST_ID}
                            isDisabled={!canProceed}
                            isLoading={isLoading}
                        >
                            {!isLoading && (
                                <Translation id="moduleTrading.tradingScreen.buttons.continue" />
                            )}
                        </Button>
                    </AnimatedBox>
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
                </VStack>
            )}
        </>
    );
};
