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
                    <Icon name="check" size="large" color="iconPrimaryDefault" />
                ) : (
                    <Icon name="x" size="large" color="iconAlertRed" />
                )}
            </Box>
            <Box>
                {isTradingAvailableForForm ? (
                    <Text variant="body-sm" color="textSecondaryHighlight">
                        <Translation id="tradingResidence.locationSettings.tradingAvailable" />
                    </Text>
                ) : (
                    <Text variant="body-sm" color="textAlertRed">
                        <Translation id="tradingResidence.locationSettings.tradingUnavailable" />
                    </Text>
                )}
            </Box>
        </HStack>
    );
};
