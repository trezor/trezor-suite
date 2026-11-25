import { forwardRef } from 'react';
import { LinearTransition } from 'react-native-reanimated';

import { Assets } from '@suite-native/assets';
import { AnimatedVStack, VStack } from '@suite-native/atoms';
import { PromoBanners } from '@suite-native/banners';
import { FiveBinariesHomeBanner } from '@suite-native/earn';
import { ReferAFriendCard, useReferAFriend } from '@suite-native/refer-a-friend';

import { HomescreenAlerts } from './HomescreenAlerts';
import { PortfolioGraph, type PortfolioGraphRef } from './PortfolioGraph';
import { ReferralButton } from './ReferralButton';
import { TransferButtons } from './TransferButtons';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => {
    // TODO: Embed to ReferAFriendCard after launch.
    const { isReferAFriendFeatureAvailable } = useReferAFriend();

    return (
        <VStack spacing="sp32" marginTop="sp8">
            <HomescreenAlerts />
            <AnimatedVStack spacing="sp32" layout={LinearTransition}>
                <PortfolioGraph ref={ref} />
                <VStack marginHorizontal="sp16" spacing="sp24">
                    <TransferButtons />
                    <PromoBanners />
                    <FiveBinariesHomeBanner />
                    <Assets />
                    {isReferAFriendFeatureAvailable ? <ReferAFriendCard /> : <ReferralButton />}
                </VStack>
            </AnimatedVStack>
        </VStack>
    );
});
