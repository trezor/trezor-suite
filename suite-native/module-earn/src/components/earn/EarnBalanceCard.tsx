import { Card, VStack } from '@suite-native/atoms';

import { EarnBalance } from './EarnBalance';
import { EarnBalanceBreakdown } from './EarnBalanceBreakdown';
import { EarnBalanceIncompleteFiatBanner } from './EarnBalanceIncompleteFiatBanner';

export const EarnBalanceCard = () => (
    <Card borderColor="borderNeutral" testID="@earn/balance-card">
        <VStack spacing="sp24">
            <EarnBalance />
            <EarnBalanceBreakdown />
            <EarnBalanceIncompleteFiatBanner />
        </VStack>
    </Card>
);
