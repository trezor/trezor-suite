import { Card, VStack } from '@suite-native/atoms';

import { ConciergeConfirmation } from './ConciergeConfirmation';
import { ConciergeInfoCard } from './ConciergeInfoCard';
import { ConciergeProviderPicker } from './ConciergeProviderPicker';
import { TradingLocationPickers } from '../general/TradingLocationPickers';

export const ConciergeForm = () => (
    <VStack spacing="sp16">
        <ConciergeInfoCard />
        <Card noPadding>
            <TradingLocationPickers hideSubdivisionPicker context="concierge" />
            <ConciergeProviderPicker />
        </Card>
        <ConciergeConfirmation />
    </VStack>
);
