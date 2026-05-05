import { Card, Divider, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ConciergeConfirmation } from './ConciergeConfirmation';
import { ConciergeInfoCard } from './ConciergeInfoCard';
import { ConciergeProviderPicker } from './ConciergeProviderPicker';
import { TradingLocationPickers } from '../general/TradingLocationPickers';

const dividerStyle = prepareNativeStyle(({ colors }) => ({
    borderBottomColor: colors.surfaceFillPage,
}));

export const ConciergeForm = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="sp16">
            <ConciergeInfoCard />
            <Card noPadding>
                <TradingLocationPickers hideSubdivisionPicker context="concierge" />
                <Divider style={applyStyle(dividerStyle)} />
                <ConciergeProviderPicker />
            </Card>
            <ConciergeConfirmation />
        </VStack>
    );
};
