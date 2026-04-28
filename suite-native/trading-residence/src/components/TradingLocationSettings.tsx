import { type ReactNode } from 'react';

import { type CountryChangeContextCheck } from '@suite-native/analytics';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useBottomSheetControls } from '@suite-native/trading-atoms';

import { CountryChangeContextCheckContext } from './CountryChangeContextCheckContext';
import { CountrySubdivisionPickerControlsContext } from './CountrySheet/CountrySubdivisionPickerControlsContext';
import { GLOBE_SIZE_DEFAULT, GLOBE_SIZE_MINIMUM, GlobeSvg } from './GlobeSvg';
import { LocationForm } from './LocationForm';
import { TradingAvailability } from './TradingAvailability';
import { TradingLocationPickers } from './TradingLocationPickers';
import { useAvailableScreenSquare } from '../hooks/useAvailableScreenSquare';

export type TradingLocationSettingsProps = {
    context: CountryChangeContextCheck;
    children: ReactNode | ReactNode[];
};

export const TradingLocationSettings = ({ context, children }: TradingLocationSettingsProps) => {
    const { squareSize, handleContentLayout } = useAvailableScreenSquare(
        GLOBE_SIZE_MINIMUM,
        GLOBE_SIZE_DEFAULT,
    );
    const subdivisionPickerControls = useBottomSheetControls();

    return (
        <CountryChangeContextCheckContext value={context}>
            <CountrySubdivisionPickerControlsContext value={subdivisionPickerControls}>
                <LocationForm>
                    <VStack justifyContent="space-between" flex={1}>
                        <Box flex={1} alignItems="center" justifyContent="center">
                            <GlobeSvg width={squareSize} height={squareSize} />
                        </Box>
                        <VStack paddingTop="sp32" spacing="sp24" onLayout={handleContentLayout}>
                            <VStack spacing="sp8">
                                <Text variant="headline-md" color="contentPrimary">
                                    <Translation id="tradingResidence.locationSettings.title" />
                                </Text>
                                <Text variant="body-md" color="contentSecondary">
                                    <Translation id="tradingResidence.locationSettings.description" />
                                </Text>
                            </VStack>
                            <VStack spacing="sp8">
                                <Card noPadding>
                                    <TradingLocationPickers
                                        context={context}
                                        testID="@trading-residence"
                                        hasCountrySubdivisionBottomBorder={false}
                                    />
                                </Card>
                                <TradingAvailability />
                            </VStack>
                            <VStack spacing="sp12">{children}</VStack>
                        </VStack>
                    </VStack>
                </LocationForm>
            </CountrySubdivisionPickerControlsContext>
        </CountryChangeContextCheckContext>
    );
};
