import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useCountrySelectionAnalyticsReport } from '../hooks/useCountrySelectionAnalyticsReport';

export type SkipButtonProps = {
    onPress: () => void;
};

export const SkipButton = ({ onPress }: SkipButtonProps) => {
    const analyticsReport = useCountrySelectionAnalyticsReport();

    const skipLocation = () => {
        analyticsReport('cancel');
        onPress();
    };

    return (
        <Button colorScheme="tertiaryElevation0" size="medium" onPress={skipLocation}>
            <Translation id="tradingResidence.locationSettings.skipButton" />
        </Button>
    );
};
