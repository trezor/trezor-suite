import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { useIsTradingAvailableForForm } from '../hooks/useIsTradingAvailableForForm';

export const TradingAvailability = () => {
    const isTradingAvailableForForm = useIsTradingAvailableForForm();

    if (isTradingAvailableForForm) {
        return (
            <HStack justifyContent="center" alignItems="center">
                <Box>
                    <Icon name="check" size="large" color="iconPrimaryDefault" />
                </Box>
                <Box>
                    <Text variant="hint" color="textSecondaryHighlight">
                        <Translation id="tradingResidence.locationSettings.tradingAvailable" />
                    </Text>
                </Box>
            </HStack>
        );
    }

    return (
        <HStack justifyContent="center" alignItems="center">
            <Box>
                <Icon name="x" size="large" color="iconAlertRed" />
            </Box>
            <Box>
                <Text variant="hint" color="textAlertRed">
                    <Translation id="tradingResidence.locationSettings.tradingUnavailable" />
                </Text>
            </Box>
        </HStack>
    );
};
