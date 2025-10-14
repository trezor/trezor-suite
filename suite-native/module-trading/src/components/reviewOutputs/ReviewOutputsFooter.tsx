import { useState } from 'react';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Button, Card } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { SignSuccessMessage } from '@suite-native/transaction-management';

export type ReviewOutputsFooterProps = {
    resolveConsent: (approved: boolean) => void;
    isConsentRequested: boolean;
    testID?: string;
};

export const ReviewOutputsFooter = ({
    isConsentRequested,
    resolveConsent,
    testID,
}: ReviewOutputsFooterProps) => {
    const [isSendInProgress, setSendInProgress] = useState(false);

    const handleSendTransaction = () => {
        if (!isSendInProgress) {
            setSendInProgress(true);
            resolveConsent(true);
        }
    };

    const buttonTestID = testID ? `${testID}/submit-button` : undefined;

    return (
        <Animated.View entering={SlideInDown}>
            <Card testID={testID}>
                <SignSuccessMessage />
                <Button
                    isLoading={isSendInProgress}
                    isDisabled={!isConsentRequested}
                    accessibilityRole="button"
                    testID={buttonTestID}
                    onPress={handleSendTransaction}
                >
                    <Translation id="moduleTrading.tradingReviewOutputs.submitButton" />
                </Button>
            </Card>
        </Animated.View>
    );
};
