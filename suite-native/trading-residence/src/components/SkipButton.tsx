import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useCountrySelectionAnalyticsReport } from '../hooks/useCountrySelectionAnalyticsReport';

export type SkipButtonProps = {
    onPress: () => void;
    testId?: string;
};

export const SkipButton = ({ onPress, testId }: SkipButtonProps) => {
    const analyticsReport = useCountrySelectionAnalyticsReport();

    const skipLocation = () => {
        analyticsReport('cancel');
        onPress();
    };

    return (
        <Button intent="neutral" priority="secondary" onPress={skipLocation} testID={testId}>
            <Translation id="tradingResidence.locationSettings.skipButton" />
        </Button>
    );
};
