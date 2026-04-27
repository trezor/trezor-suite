import { type ReactNode } from 'react';

import { isCountrySubdivisionRequired } from '@suite-common/trading';
import { type CountryChangeContextCheck } from '@suite-native/analytics';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useBottomSheetControls } from '@suite-native/trading-atoms';

import { CountryChangeContextCheckContext } from './CountryChangeContextCheckContext';
import { CountryOfResidencePicker } from './CountrySheet/CountryOfResidencePicker';
import { CountrySubdivisionPicker } from './CountrySheet/CountrySubdivisionPicker';
import { CountrySubdivisionPickerControlsContext } from './CountrySheet/CountrySubdivisionPickerControlsContext';
import { GLOBE_SIZE_DEFAULT, GLOBE_SIZE_MINIMUM, GlobeSvg } from './GlobeSvg';
import { LocationForm } from './LocationForm';
import { TradingAvailability } from './TradingAvailability';
import { useAvailableScreenSquare } from '../hooks/useAvailableScreenSquare';
import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export type TradingLocationSettingsProps = {
    context: CountryChangeContextCheck;
    children: ReactNode | ReactNode[];
};

const TradingLocationPickers = ({ context }: { context: CountryChangeContextCheck }) => {
    const { watch } = useFormContext<TradingLocationFormValues>();
    const selectedCountry = watch('country');
    const isSubdivisionRequired = isCountrySubdivisionRequired(selectedCountry?.value);

    return (
        <Card noPadding>
            <CountryOfResidencePicker
                testID="@trading/residence/country"
                context={context}
                noBottomBorder={!isSubdivisionRequired}
            />
            <CountrySubdivisionPicker
                testID="@trading/residence/country-subdivision"
                noBottomBorder
            />
        </Card>
    );
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
                                <TradingLocationPickers context={context} />
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
