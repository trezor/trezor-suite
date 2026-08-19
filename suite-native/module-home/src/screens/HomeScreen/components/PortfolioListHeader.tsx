import { forwardRef } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { AnimatedVStack, VStack } from '@suite-native/atoms';
import { PromoBanners } from '@suite-native/banners';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { FiveBinariesHomeBanner } from '@suite-native/module-earn';

import { HomescreenAlerts } from './HomescreenAlerts';
import { PortfolioGraph, type PortfolioGraphRef } from './PortfolioGraph';
import { TransferButtons } from './TransferButtons';

export const PortfolioListHeader = forwardRef<PortfolioGraphRef>((_props, ref) => (
    <VStack spacing="sp32" marginTop="sp8">
        <HomescreenAlerts />
        <AnimatedVStack spacing="sp32" layout={LinearTransition}>
            <PortfolioGraph ref={ref} />
            <VStack spacing="sp24" marginHorizontal="sp16" marginBottom="sp24">
                <TransferButtons />
                <PromoBanners />
                <FiveBinariesHomeBanner />
                <AccountsRediscoveryNeededWarning hasPadding />
            </VStack>
        </AnimatedVStack>
    </VStack>
));

PortfolioListHeader.displayName = 'PortfolioListHeader';
