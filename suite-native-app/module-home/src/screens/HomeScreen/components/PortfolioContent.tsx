import { forwardRef } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { Assets } from '@suite-native/assets';
import { AnimatedVStack, VStack } from '@suite-native/atoms';
import { PromoBanners } from '@suite-native/banners';

import { HomescreenAlerts } from './HomescreenAlerts';
import { PortfolioGraph, type PortfolioGraphRef } from './PortfolioGraph';
import { ReferralButton } from './ReferralButton';
import { TransferButtons } from './TransferButtons';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => (
    <VStack spacing="sp32" marginTop="sp8">
        <HomescreenAlerts />
        <AnimatedVStack spacing="sp32" layout={LinearTransition}>
            <PortfolioGraph ref={ref} />
            <VStack spacing="sp64" marginHorizontal="sp16">
                <VStack spacing="sp24">
                    <TransferButtons />
                    <PromoBanners />
                    <Assets />
                </VStack>
                <ReferralButton />
            </VStack>
        </AnimatedVStack>
    </VStack>
));
