import { LinearTransition } from 'react-native-reanimated';

import { Assets } from '@suite-native/assets';
import { AnimatedVStack, VStack } from '@suite-native/atoms';

import { HomescreenAlerts } from './HomescreenAlerts';
import { PortfolioGraph } from './PortfolioGraph';
import { ReferralButton } from './ReferralButton';
import { TransferButtons } from './TransferButtons';

export const PortfolioContent = () => (
    <VStack spacing="sp32" marginTop="sp8">
        <HomescreenAlerts />
        <AnimatedVStack spacing="sp32" layout={LinearTransition}>
            <PortfolioGraph />
            <VStack spacing="sp64" marginHorizontal="sp16">
                <VStack spacing="sp24">
                    <TransferButtons />
                    <Assets />
                </VStack>
                <ReferralButton />
            </VStack>
        </AnimatedVStack>
    </VStack>
);
