import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { useIsTradingAvailableForForm } from '../hooks/useIsTradingAvailableForForm';

export const TradingAvailability = () => {
    const isTradingAvailableForForm = useIsTradingAvailableForForm();

    return (
        <HStack justifyContent="center" alignItems="center">
            <Box>
                {isTradingAvailableForForm ? (
                    <Icon name="check" size="large" color="contentBrand" />
                ) : (
                    <Icon name="x" size="large" color="contentCritical" />
                )}
            </Box>
            <Box>
                {isTradingAvailableForForm ? (
                    <Text variant="body-sm" color="contentBrand">
                        <Translation id="tradingResidence.locationSettings.tradingAvailable" />
                    </Text>
                ) : (
                    <Text variant="body-sm" color="contentCritical">
                        <Translation id="tradingResidence.locationSettings.tradingUnavailable" />
                    </Text>
                )}
            </Box>
        </HStack>
    );
};
