import { useState } from 'react';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Button, Card } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SignSuccessMessage } from '@suite-native/transaction-management';

export type ReviewOutputsFooterProps = {
    resolveConsent: (approved: boolean) => void;
    isConsentRequested: boolean;
};

export const ReviewOutputsFooter = ({
    isConsentRequested,
    resolveConsent,
}: ReviewOutputsFooterProps) => {
    const [isSendInProgress, setSendInProgress] = useState(false);

    const handleSendTransaction = () => {
        if (!isSendInProgress) {
            setSendInProgress(true);
            resolveConsent(true);
        }
    };

    return (
        <Animated.View entering={SlideInDown}>
            <Card>
                <SignSuccessMessage />
                <Button
                    isLoading={isSendInProgress}
                    isDisabled={!isConsentRequested}
                    accessibilityRole="button"
                    testID="@trading/send-transaction-button"
                    onPress={handleSendTransaction}
                >
                    <Translation id="moduleTrading.tradingReviewOutputs.submitButton" />
                </Button>
            </Card>
        </Animated.View>
    );
};
