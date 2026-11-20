import { useSelector } from 'react-redux';

import { Divider, VStack } from '@suite-native/atoms';
import { PromoBanners, selectHasVisiblePromoBanners } from '@suite-native/banners';

export const PortfolioPromoBanners = () => {
    const hasVisiblePromoBanners = useSelector(selectHasVisiblePromoBanners);

    if (!hasVisiblePromoBanners) return null;

    return (
        <VStack spacing="sp20" paddingTop="sp20">
            <PromoBanners hasNegativeVerticalMargin={false} hasHorizontalMargin />
            <Divider />
        </VStack>
    );
};
