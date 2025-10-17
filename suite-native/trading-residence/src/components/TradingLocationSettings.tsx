import { ReactNode } from 'react';

import { CountryChangeContextIOS } from '@suite-native/analytics';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { CountryOfResidencePicker } from './CountrySheet/CountryOfResidencePicker';
import { GlobeSvg } from './GlobeSvg';
import { LocationForm } from './LocationForm';
import { TradingAvailability } from './TradingAvailability';

export type TradingLocationSettingsProps = {
    context: CountryChangeContextIOS;
    children: ReactNode | ReactNode[];
};

export const TradingLocationSettings = ({ context, children }: TradingLocationSettingsProps) => (
    <LocationForm>
        <VStack justifyContent="space-between" flex={1}>
            <Box flex={1} alignItems="center" justifyContent="center">
                <GlobeSvg />
            </Box>
            <VStack paddingVertical="sp32" spacing="sp24">
                <VStack spacing="sp8">
                    <Text variant="titleMedium" color="textDefault">
                        <Translation id="tradingResidence.locationSettings.title" />
                    </Text>
                    <Text variant="body" color="textSubdued">
                        <Translation id="tradingResidence.locationSettings.description" />
                    </Text>
                </VStack>
                <VStack spacing="sp8">
                    <Card noPadding>
                        <CountryOfResidencePicker
                            testID="@trading/residence/country"
                            context={context}
                        />
                    </Card>
                    <TradingAvailability />
                </VStack>
                <VStack spacing="sp8">{children}</VStack>
            </VStack>
        </VStack>
    </LocationForm>
);
