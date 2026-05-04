import { Card, Divider, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ConciergeConfirmation } from './ConciergeConfirmation';
import { ConciergeInfoCard } from './ConciergeInfoCard';
import { ConciergeProviderPicker } from './ConciergeProviderPicker';
import { TradingCountryOfResidencePicker } from '../general/TradingCountryOfResidencePicker';

const dividerStyle = prepareNativeStyle(({ colors }) => ({
    borderBottomColor: colors.surfaceFillPage,
}));

export const ConciergeForm = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="sp16">
            <ConciergeInfoCard />
            <Card noPadding>
                <TradingCountryOfResidencePicker
                    testID="@trading/concierge/country"
                    context="concierge"
                />
                <Divider style={applyStyle(dividerStyle)} />
                <ConciergeProviderPicker />
            </Card>
            <ConciergeConfirmation />
        </VStack>
    );
};
