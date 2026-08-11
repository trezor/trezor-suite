import { useState } from 'react';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ScrollToEndOnMount } from '@suite-native/scrollview';

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
        <Animated.View entering={SlideInDown} testID={testID}>
            <ScrollToEndOnMount>
                <Button
                    isLoading={isSendInProgress}
                    isDisabled={!isConsentRequested}
                    accessibilityRole="button"
                    testID={buttonTestID}
                    onPress={handleSendTransaction}
                >
                    <Translation id="moduleTrading.tradingReviewOutputs.submitButton" />
                </Button>
            </ScrollToEndOnMount>
        </Animated.View>
    );
};
