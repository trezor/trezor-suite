import { forwardRef } from 'react';
import { type ScrollViewProps } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';

import { Assets } from '@suite-native/assets';
import { AnimatedVStack, Box, VStack } from '@suite-native/atoms';
import { PromoBanners } from '@suite-native/banners';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { FiveBinariesHomeBanner } from '@suite-native/module-earn';

import { HomescreenAlerts } from './HomescreenAlerts';
import { PortfolioGraph, type PortfolioGraphRef } from './PortfolioGraph';
import { ReferralButton } from './ReferralButton';
import { TransferButtons } from './TransferButtons';

type PortfolioContentProps = {
    refreshControl?: ScrollViewProps['refreshControl'];
};

export const PortfolioContent = forwardRef<PortfolioGraphRef, PortfolioContentProps>(
    ({ refreshControl }, ref) => (
        <Assets
            refreshControl={refreshControl}
            listHeaderComponent={
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
            }
            listFooterComponent={
                <Box marginTop="sp64" marginHorizontal="sp16">
                    <ReferralButton />
                </Box>
            }
        />
    ),
);

PortfolioContent.displayName = 'PortfolioContent';
